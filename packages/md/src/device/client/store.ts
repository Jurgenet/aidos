import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Device, CreateDeviceInput, UpdateDeviceInput } from '../types/index.js'

async function readErrorMessage(res: Response): Promise<string | null> {
  try {
    const body = (await res.json()) as { error?: { message?: string } }
    return body.error?.message ?? null
  } catch {
    return null
  }
}

/**
 * Pinia setup-store для Device. Хранит список + выбранное устройство,
 * CRUD через REST API (`/api/device`).
 */
export const useDeviceStore = defineStore('device', () => {
  const devices = ref<Device[]>([])
  const current = ref<Device | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch('/api/device')
      if (!res.ok) {
        const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
        throw new Error(msg)
      }
      const data = (await res.json()) as { items: Device[] }
      devices.value = data.items
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
      const res = await fetch(`/api/device/${id}`)
      if (!res.ok) {
        const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
        throw new Error(msg)
      }
      current.value = (await res.json()) as Device
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  async function create(input: CreateDeviceInput): Promise<Device> {
    const res = await fetch('/api/device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
      throw new Error(msg)
    }
    const created = (await res.json()) as Device
    devices.value.push(created)
    return created
  }

  async function update(id: string, input: UpdateDeviceInput): Promise<Device> {
    const res = await fetch(`/api/device/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
      throw new Error(msg)
    }
    const updated = (await res.json()) as Device
    const idx = devices.value.findIndex((d) => d.id === id)
    if (idx >= 0) devices.value[idx] = updated
    if (current.value?.id === id) current.value = updated
    return updated
  }

  async function remove(id: string): Promise<void> {
    const res = await fetch(`/api/device/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
      throw new Error(msg)
    }
    devices.value = devices.value.filter((d) => d.id !== id)
    if (current.value?.id === id) current.value = null
  }

  return {
    devices,
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
