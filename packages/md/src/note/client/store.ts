import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Note, CreateNoteInput, UpdateNoteInput } from '../types/index.js'

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
 * Pinia setup-store для Note. Хранит список + выбранную заметку,
 * предоставляет CRUD-операции через REST API (`/api/note`).
 */
export const useNoteStore = defineStore('note', () => {
  const notes = ref<Note[]>([])
  const current = ref<Note | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch('/api/note')
      if (!res.ok) {
        const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
        throw new Error(msg)
      }
      const data = (await res.json()) as { items: Note[] }
      notes.value = data.items
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
      const res = await fetch(`/api/note/${id}`)
      if (!res.ok) {
        const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
        throw new Error(msg)
      }
      current.value = (await res.json()) as Note
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  async function create(input: CreateNoteInput): Promise<Note> {
    const res = await fetch('/api/note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
      throw new Error(msg)
    }
    const created = (await res.json()) as Note
    notes.value.push(created)
    return created
  }

  async function update(id: string, input: UpdateNoteInput): Promise<Note> {
    const res = await fetch(`/api/note/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
      throw new Error(msg)
    }
    const updated = (await res.json()) as Note
    const idx = notes.value.findIndex((n) => n.id === id)
    if (idx >= 0) notes.value[idx] = updated
    if (current.value?.id === id) current.value = updated
    return updated
  }

  async function remove(id: string): Promise<void> {
    const res = await fetch(`/api/note/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
      throw new Error(msg)
    }
    notes.value = notes.value.filter((n) => n.id !== id)
    if (current.value?.id === id) current.value = null
  }

  return {
    notes,
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
