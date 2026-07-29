import { promises as fs } from 'node:fs'
import path from 'node:path'
import { LogModel, listLogs } from '@aid/me/log/server'
import type { Log, LogAction, LogEntity } from '@aid/me/log/types'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

/**
 * Telegram-нотификатор об изменениях в entity-коллекциях.
 *
 * Архитектура:
 * - Long-poll getUpdates для приёма команд (/start, /on, /off, /status, /last, /list)
 * - Поллинг коллекции logs каждые TELEGRAM_POLL_INTERVAL_MS для отправки
 *   новых записей подписанному chat_id
 * - State (chatId, enabled) в .data/telegram-state.json — переживает
 *   рестарт server'а, не коммитится в git
 *
 * Безопасность: один подписчик (chat_id). TELEGRAM_CHAT_ID в env
 * фиксирует chat_id (тогда /start не перезаписывает). Если env
 * пустой — /start от любого юзера перехватывает chat_id, последующие
 * /start перезатирают. Это single-user проект, для прод-надо добавить
 * /register <secret> flow.
 *
 * Если TELEGRAM_BOT_TOKEN пустой — start() ничего не делает, stop() no-op.
 */

const TG_API = 'https://api.telegram.org'

type State = {
  chatId: number | null
  enabled: boolean
}

const ACTION_EMOJI: Record<LogAction, string> = {
  create: '🆕',
  update: '✏️',
  delete: '🗑',
}

const ENTITY_LABEL: Record<LogEntity, string> = {
  user: 'Пользователь',
  account: 'Аккаунт',
  note: 'Заметка',
  device: 'Устройство',
  order: 'Заказ',
  file: 'Файл',
}

class TelegramNotifier {
  private state: State = { chatId: null, enabled: env.TELEGRAM_ENABLED }
  private lastSeenTimestamp: Date | null = null
  private updateOffset = 0
  private running = false
  private updateTimer: NodeJS.Timeout | null = null
  private logPollTimer: NodeJS.Timeout | null = null
  private readonly stateFile: string
  private readonly stateDir: string

  constructor() {
    this.stateDir = env.TELEGRAM_STATE_DIR
    this.stateFile = path.join(this.stateDir, 'telegram-state.json')
  }

  /** true если фича вообще включена (задан токен). */
  isEnabled(): boolean {
    return env.TELEGRAM_BOT_TOKEN !== ''
  }

  async start(): Promise<void> {
    if (!this.isEnabled()) {
      logger.info('telegram notifier disabled (TELEGRAM_BOT_TOKEN not set)')
      return
    }
    await this.loadState()
    // Если TELEGRAM_CHAT_ID задан в env — фиксируем (не перезаписывается /start)
    if (env.TELEGRAM_CHAT_ID !== '') {
      const parsed = Number(env.TELEGRAM_CHAT_ID)
      if (Number.isFinite(parsed) && parsed > 0) {
        this.state.chatId = parsed
        await this.saveState()
        logger.info({ chatId: parsed, fixed: true }, 'telegram notifier started (chat_id from env)')
      }
    }
    if (this.state.chatId === null) {
      logger.info('telegram notifier started (waiting for /start to register chat_id)')
    } else {
      logger.info({ chatId: this.state.chatId, enabled: this.state.enabled }, 'telegram notifier started')
    }
    this.running = true
    this.updateTimer = setInterval(() => void this.pollUpdates(), 2_000)
    this.logPollTimer = setInterval(() => void this.pollLogs(), env.TELEGRAM_POLL_INTERVAL_MS)
    // Запускаем первый поллинг логов сразу (чтобы не ждать интервал)
    void this.pollLogs()
  }

  async stop(): Promise<void> {
    this.running = false
    if (this.updateTimer !== null) clearInterval(this.updateTimer)
    if (this.logPollTimer !== null) clearInterval(this.logPollTimer)
    this.updateTimer = null
    this.logPollTimer = null
    logger.info('telegram notifier stopped')
  }

  // ─── state persistence ─────────────────────────────────────────────

  private async loadState(): Promise<void> {
    try {
      const raw = await fs.readFile(this.stateFile, 'utf8')
      const parsed = JSON.parse(raw) as Partial<State>
      this.state.chatId = typeof parsed.chatId === 'number' ? parsed.chatId : null
      this.state.enabled = typeof parsed.enabled === 'boolean' ? parsed.enabled : this.state.enabled
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.warn({ err: e }, 'failed to load telegram state, starting fresh')
      }
    }
  }

  private async saveState(): Promise<void> {
    try {
      await fs.mkdir(this.stateDir, { recursive: true })
      await fs.writeFile(this.stateFile, JSON.stringify(this.state, null, 2), 'utf8')
    } catch (e) {
      logger.error({ err: e }, 'failed to save telegram state')
    }
  }

  // ─── Telegram Bot API ───────────────────────────────────────────────

  private async callApi<T>(method: string, params: Record<string, unknown>): Promise<T | null> {
    const url = `${TG_API}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      const data = (await r.json()) as { ok: boolean; result?: T; description?: string }
      if (!data.ok) {
        logger.warn({ method, description: data.description }, 'telegram API call failed')
        return null
      }
      return data.result ?? null
    } catch (e) {
      logger.error({ err: e, method }, 'telegram API request failed')
      return null
    }
  }

  private async sendMessage(chatId: number, text: string): Promise<void> {
    await this.callApi('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML' })
  }

  // ─── update polling (commands) ──────────────────────────────────────

  private async pollUpdates(): Promise<void> {
    if (!this.running) return
    type Update = {
      update_id: number
      message?: { chat: { id: number }; text?: string; from?: { first_name?: string } }
    }
    type UpdatesResponse = { result: Update[] }
    const res = await this.callApi<UpdatesResponse['result']>('getUpdates', {
      offset: this.updateOffset,
      timeout: 20,
      allowed_updates: ['message'],
    })
    if (!res) return
    for (const update of res) {
      this.updateOffset = update.update_id + 1
      const msg = update.message
      if (!msg || typeof msg.text !== 'string') continue
      await this.handleCommand(msg.chat.id, msg.text, msg.from?.first_name ?? 'друг')
    }
  }

  private async handleCommand(chatId: number, rawText: string, firstName: string): Promise<void> {
    const text = rawText.trim()
    // /start — единственная команда, которая регистрирует chat_id.
    // Остальные требуют, чтобы chat_id уже был зарегистрирован.
    if (text === '/start' || text.startsWith('/start@')) {
      const envFixed = env.TELEGRAM_CHAT_ID !== ''
      if (envFixed) {
        await this.sendMessage(chatId, 'chat_id зафиксирован через TELEGRAM_CHAT_ID в env. /start игнорируется.')
        return
      }
      this.state.chatId = chatId
      this.state.enabled = true
      await this.saveState()
      logger.info({ chatId }, 'telegram chat registered via /start')
      await this.sendMessage(
        chatId,
        `👋 Привет, ${firstName}!\n\n` +
          `Это AID-нотификатор. Я буду присылать сюда каждое создание/изменение/удаление ` +
          `в entity-коллекциях (User, Account, Note, Device, Order).\n\n` +
          `Команды:\n` +
          `/help — список команд\n` +
          `/on /off — вкл/выкл уведомления\n` +
          `/status — текущее состояние\n` +
          `/last [N] — последние N записей (по умолчанию 5)\n` +
          `/list — то же что /last`,
      )
      return
    }
    if (text === '/help') {
      await this.sendMessage(
        chatId,
        'AID-нотификатор — команды:\n' +
          '/start — зарегистрировать этот чат (если не зафиксирован в env)\n' +
          '/on — включить уведомления\n' +
          '/off — выключить уведомления\n' +
          '/status — состояние (chatId, enabled, последний отправленный timestamp)\n' +
          '/last [N] — последние N записей из logs (default 5, max 20)',
      )
      return
    }
    // Все остальные команды — только для зарегистрированного chatId.
    if (this.state.chatId !== chatId) {
      await this.sendMessage(chatId, 'Этот чат не зарегистрирован. Отправь /start.')
      return
    }
    if (text === '/on') {
      this.state.enabled = true
      await this.saveState()
      await this.sendMessage(chatId, '🔔 Уведомления включены.')
      return
    }
    if (text === '/off') {
      this.state.enabled = false
      await this.saveState()
      await this.sendMessage(chatId, '🔕 Уведомления выключены.')
      return
    }
    if (text === '/status') {
      await this.sendMessage(
        chatId,
        `📊 Статус\n` +
          `chatId: ${this.state.chatId}\n` +
          `enabled: ${this.state.enabled}\n` +
          `lastSeen: ${this.lastSeenTimestamp?.toISOString() ?? '—'}\n` +
          `polling every: ${env.TELEGRAM_POLL_INTERVAL_MS}ms`,
      )
      return
    }
    if (text === '/list' || text.startsWith('/last')) {
      const m = text.match(/^\/last(?:\s+(\d+))?$/)
      const n = Math.min(Math.max(Number(m?.[1] ?? 5), 1), 20)
      const items = await listLogs({ limit: n })
      if (items.length === 0) {
        await this.sendMessage(chatId, 'Записей в logs пока нет.')
        return
      }
      const lines = items.map((log) => formatLogShort(log))
      await this.sendMessage(chatId, `📜 Последние ${items.length}:\n\n` + lines.join('\n\n'))
      return
    }
    await this.sendMessage(chatId, 'Неизвестная команда. /help для списка.')
  }

  // ─── log polling (notifications) ────────────────────────────────────

  private async pollLogs(): Promise<void> {
    if (!this.running) return
    if (this.state.chatId === null || !this.state.enabled) {
      // Даже если чат не зарегистрирован, сдвигаем watermark чтобы
      // не отправлять ВСЮ историю при первом /start.
      if (this.lastSeenTimestamp === null) {
        const latest = await LogModel.findOne().sort({ timestamp: -1 }).lean()
        if (latest?.timestamp) this.lastSeenTimestamp = new Date(latest.timestamp)
      }
      return
    }
    const query: Record<string, unknown> = {}
    if (this.lastSeenTimestamp !== null) {
      query.timestamp = { $gt: this.lastSeenTimestamp }
    }
    type LogDoc = {
      _id: unknown
      entity: string
      action: string
      documentId: string
      before?: unknown
      after?: unknown
      timestamp: Date
    }
    let docs: LogDoc[] = []
    try {
      docs = await LogModel.find(query).sort({ timestamp: 1 }).limit(50).lean()
    } catch (e) {
      logger.error({ err: e }, 'telegram log poll query failed')
      return
    }
    if (docs.length === 0) return
    for (const doc of docs) {
      const log: Log = {
        id: String(doc._id),
        entity: doc.entity as LogEntity,
        action: doc.action as LogAction,
        documentId: doc.documentId,
        userId: null,
        before: (doc.before as Record<string, unknown> | null) ?? null,
        after: (doc.after as Record<string, unknown> | null) ?? null,
        timestamp: doc.timestamp instanceof Date ? doc.timestamp.toISOString() : String(doc.timestamp),
      }
      await this.sendMessage(this.state.chatId, formatLogNotification(log))
      this.lastSeenTimestamp = new Date(log.timestamp)
    }
  }
}

// ─── formatting helpers ──────────────────────────────────────────────

function formatLogNotification(log: Log): string {
  const emoji = ACTION_EMOJI[log.action]
  const label = ENTITY_LABEL[log.entity]
  const lines: string[] = []
  lines.push(`${emoji} <b>${label}: ${log.action}</b>`)
  lines.push(`id: <code>${log.documentId}</code>`)
  lines.push(`время: ${formatDateTime(log.timestamp)}`)
  if (log.action === 'create' && log.after) {
    lines.push('')
    lines.push(formatFields(log.after, ['id', 'createdAt', 'updatedAt']))
  } else if (log.action === 'delete' && log.before) {
    lines.push('')
    lines.push(formatFields(log.before, ['id', 'createdAt', 'updatedAt']))
  } else if (log.action === 'update' && log.before && log.after) {
    lines.push('')
    lines.push(diffFields(log.before, log.after))
  }
  return lines.join('\n')
}

function formatLogShort(log: Log): string {
  const emoji = ACTION_EMOJI[log.action]
  const label = ENTITY_LABEL[log.entity]
  return `${emoji} ${label} ${log.action} <code>${log.documentId}</code> — ${formatDateTime(log.timestamp)}`
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatFields(obj: Record<string, unknown>, skip: string[]): string {
  const skipSet = new Set(skip)
  return Object.entries(obj)
    .filter(([k]) => !skipSet.has(k))
    .map(([k, v]) => `  ${k}: <code>${escapeHtml(String(JSON.stringify(v) ?? ''))}</code>`)
    .join('\n')
}

function diffFields(before: Record<string, unknown>, after: Record<string, unknown>): string {
  const keys = new Set<string>([...Object.keys(before), ...Object.keys(after)])
  const skip = new Set(['id', 'createdAt', 'updatedAt'])
  const out: string[] = []
  for (const k of keys) {
    if (skip.has(k)) continue
    const b = JSON.stringify(before[k] ?? null)
    const a = JSON.stringify(after[k] ?? null)
    if (b === a) continue
    out.push(`  ${k}: <code>${escapeHtml(b)}</code> → <code>${escapeHtml(a)}</code>`)
  }
  return out.length > 0 ? out.join('\n') : '  (без изменений)'
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ─── public helper: listLogs shim (re-exports server-side) ───────────

// ─── singleton ───────────────────────────────────────────────────────

let instance: TelegramNotifier | null = null

export function getTelegramNotifier(): TelegramNotifier {
  if (instance === null) {
    instance = new TelegramNotifier()
  }
  return instance
}
