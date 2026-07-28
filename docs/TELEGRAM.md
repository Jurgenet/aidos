# Telegram-нотификатор

Сервис в server-процессе: поллит коллекцию `logs` и шлёт новые записи
(create/update/delete сущностей) в Telegram-бота. Управляется
командами прямо в чате.

## Как включить

1. Создай бота через [@BotFather](https://t.me/BotFather) (`/newbot`),
   скопируй токен.
2. Положи токен в `.env` (рядом с другими TELEGRAM_*):

   ```env
   TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
   # опционально — зафиксировать chat_id (тогда /start игнорируется)
   TELEGRAM_CHAT_ID=
   TELEGRAM_ENABLED=true
   TELEGRAM_POLL_INTERVAL_MS=5000
   ```

3. Перезапусти server: `docker compose up -d server`.
4. Открой своего бота в Telegram и напиши `/start`. Бот ответит
   приветствием и зарегистрирует chat_id. После этого начнут
   приходить уведомления о CRUD-операциях в User/Account/Note/Device/Order.

Без `TELEGRAM_BOT_TOKEN` фича полностью выключена (server даже не
создаёт long-poll соединение, см. логи: `telegram notifier disabled`).

## Команды бота

| Команда | Что делает |
|---|---|
| `/start` | Регистрирует этот чат (если `TELEGRAM_CHAT_ID` не зафиксирован в env) |
| `/help` | Список команд |
| `/on` | Включить уведомления (стейт в `.data/telegram-state.json`) |
| `/off` | Выключить уведомления (стейт в `.data/telegram-state.json`) |
| `/status` | Текущее состояние: chatId, enabled, lastSeen timestamp, интервал |
| `/last [N]` | Последние N записей из logs (default 5, max 20) — то же, что `/list` |

Все команды кроме `/start` требуют, чтобы чат был зарегистрирован.
Если `/start` прислал чужой чат (а `TELEGRAM_CHAT_ID` пустой) — он
перезапишет chat_id. Для single-user проекта это нормально. Для
ограничения доступа — задай `TELEGRAM_CHAT_ID` в env явно (тогда
`/start` будет игнорироваться, а слать команды сможет только этот чат).

## Формат уведомления

```
🆕 Пользователь: create
id: 6a68a87e682ce8cbc32304d1
время: 28.07.2026 16:02:54

  email: "audit-test@example.com"
  name: "Audit Test"
  role: "user"
```

```
✏️ Пользователь: update
id: 6a68a87e682ce8cbc32304d1
время: 28.07.2026 16:03:02

  name: "Audit Test" → "Audit Test Updated"
  role: "user" → "manager"
```

```
🗑 Пользователь: delete
id: 6a68a87e682ce8cbc32304d1
время: 28.07.2026 16:03:03

  email: "audit-test@example.com"
  name: "Audit Test Updated"
  role: "manager"
```

Иконка: 🆕 create, ✏️ update, 🗑 delete. Игнорируются служебные
поля `id`, `createdAt`, `updatedAt` — для update показываются только
реально изменённые поля (`old → new`).

## Архитектура

```
┌─────────────────┐         ┌──────────────┐        ┌──────────────┐
│  Telegram Bot   │◄────────│   server     │───────►│    Mongo     │
│      API        │  HTTPS  │              │ driver │   logs coll  │
│  api.telegram   │  poll   │  • getUpdates│        │              │
│     .org        │  (2s)   │  • poll logs │        │              │
└─────────────────┘         │    (5s)      │        └──────────────┘
                            └──────────────┘
```

- **Long-poll getUpdates** каждые 2с для приёма команд (`timeout=20s` —
  длинный poll внутри Telegram, экономим запросы). Если ничего нет —
  сервер почти не дёргает API.
- **Поллинг logs** каждые `TELEGRAM_POLL_INTERVAL_MS` (default 5с). На
  старте выставляет watermark на «последнюю запись в БД», чтобы не
  высылать всю историю.
- **Стейт** (chat_id, enabled) в `.data/telegram-state.json` — переживает
  рестарт server'а, в git не коммитится (`.gitignore`).

## Ограничения

- **Один подписчик** (chat_id). Несколько чатов = несколько разных
  инстансов server'а. Для multi-tenant — переделать стейт в Mongo и
  сделать индекс по chat_id.
- **5 секунд задержки** (поллинг). Если нужна мгновенная доставка —
  подписаться на `recordLog` напрямую и слать HTTP-запрос в Telegram
  синхронно, но это связывает CRUD-скорость с Telegram API latency.
- **Без auth** — кто угодно может `/start` бот и получать уведомления.
  В single-user dev-режиме достаточно. Для прод — `TELEGRAM_CHAT_ID`
  в env или `/register <secret>` flow.
- **Без фильтров** — приходят все CRUD по всем entity. Если шумно,
  понизь `TELEGRAM_POLL_INTERVAL_MS` или доработай фильтр в `pollLogs()`
  в `apps/server/src/services/telegram.ts`.

## Troubleshooting

| Симптом | Что делать |
|---|---|
| `telegram notifier disabled` в логах | `TELEGRAM_BOT_TOKEN` пуст в env, фича выключена |
| `/start` отвечает «чат не зарегистрирован» | Сначала нужно `/start` — это единственная команда, которая регистрирует |
| `/start` отвечает «chat_id зафиксирован» | `TELEGRAM_CHAT_ID` задан в env, фиксирован |
| Уведомления не приходят после CRUD | Проверь `/status` — `enabled: false`? `/on` чтобы включить. `lastSeen` растёт? |
| Бот молчит вообще | `docker logs aid-server \| grep telegram` — там будет либо успешный старт, либо ошибка от Telegram API |
| `getUpdates` 409 conflict | Где-то ещё запущен long-poll с тем же токеном. Убедись, что только один server использует токен |
| `sendMessage` 400 chat not found | Бот не получал `/start` от этого юзера, или chat_id неверный |

## Сброс стейта

```bash
rm .data/telegram-state.json
docker compose restart server
```

После рестарта нужно снова `/start` (если `TELEGRAM_CHAT_ID` пустой).
