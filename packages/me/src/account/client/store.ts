import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Account, CreateAccountInput, UpdateAccountInput } from '../types/index.js'

/**
 * Парсит ошибочный ответ сервера и достаёт человекочитаемое сообщение.
 * Возвращает `null`, если body не JSON или нет поля `error.message`.
 */
async function readErrorMessage(res: Response): Promise<string | null> {
  try {
    const body = (await res.json()) as { error?: { message?: string } }
    return body.error?.message ?? null
  } catch {
    return null
  }
}

/**
 * Pinia setup-store для Account. Хранит список + выбранный аккаунт,
 * предоставляет CRUD-операции через REST API (`/api/account`).
 *
 * Использование:
 * ```ts
 * const store = useAccountStore()
 * await store.fetchAll()
 * ```
 */
export const useAccountStore = defineStore('account', () => {
  const accounts = ref<Account[]>([])
  const current = ref<Account | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch('/api/account')
      if (!res.ok) {
        const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
        throw new Error(msg)
      }
      const data = (await res.json()) as { items: Account[] }
      accounts.value = data.items
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`/api/account/${id}`)
      if (!res.ok) {
        const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
        throw new Error(msg)
      }
      current.value = (await res.json()) as Account
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  async function create(input: CreateAccountInput): Promise<Account> {
    const res = await fetch('/api/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
      throw new Error(msg)
    }
    const created = (await res.json()) as Account
    accounts.value.push(created)
    return created
  }

  async function update(id: string, input: UpdateAccountInput): Promise<Account> {
    const res = await fetch(`/api/account/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
      throw new Error(msg)
    }
    const updated = (await res.json()) as Account
    const idx = accounts.value.findIndex((a) => a.id === id)
    if (idx >= 0) accounts.value[idx] = updated
    if (current.value?.id === id) current.value = updated
    return updated
  }

  async function remove(id: string): Promise<void> {
    const res = await fetch(`/api/account/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
      throw new Error(msg)
    }
    accounts.value = accounts.value.filter((a) => a.id !== id)
    if (current.value?.id === id) current.value = null
  }

  return {
    accounts,
    current,
    loading,
    error,
    fetchAll,
    fetchById,
    create,
    update,
    remove,
  }
})
