import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User, CreateUserInput, UpdateUserInput } from '../types/index.js'

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
 * Pinia setup-store для User. Хранит список + выбранного пользователя,
 * предоставляет CRUD-операции через REST API (`/api/user`).
 *
 * Использование:
 * ```ts
 * const store = useUserStore()
 * await store.fetchAll()
 * ```
 */
export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const current = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch('/api/user')
      if (!res.ok) {
        const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
        throw new Error(msg)
      }
      const data = (await res.json()) as { items: User[] }
      users.value = data.items
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
      const res = await fetch(`/api/user/${id}`)
      if (!res.ok) {
        const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
        throw new Error(msg)
      }
      current.value = (await res.json()) as User
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  async function create(input: CreateUserInput): Promise<User> {
    const res = await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
      throw new Error(msg)
    }
    const created = (await res.json()) as User
    users.value.push(created)
    return created
  }

  async function update(id: string, input: UpdateUserInput): Promise<User> {
    const res = await fetch(`/api/user/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
      throw new Error(msg)
    }
    const updated = (await res.json()) as User
    const idx = users.value.findIndex((u) => u.id === id)
    if (idx >= 0) users.value[idx] = updated
    if (current.value?.id === id) current.value = updated
    return updated
  }

  async function remove(id: string): Promise<void> {
    const res = await fetch(`/api/user/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
      throw new Error(msg)
    }
    users.value = users.value.filter((u) => u.id !== id)
    if (current.value?.id === id) current.value = null
  }

  return {
    users,
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
