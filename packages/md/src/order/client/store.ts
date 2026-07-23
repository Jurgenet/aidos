import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Order, CreateOrderInput, UpdateOrderInput } from '../types/index.js'

async function readErrorMessage(res: Response): Promise<string | null> {
  try {
    const body = (await res.json()) as { error?: { message?: string } }
    return body.error?.message ?? null
  } catch {
    return null
  }
}

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>([])
  const current = ref<Order | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch('/api/order')
      if (!res.ok) {
        const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
        throw new Error(msg)
      }
      const data = (await res.json()) as { items: Order[] }
      orders.value = data.items
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
      const res = await fetch(`/api/order/${id}`)
      if (!res.ok) {
        const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
        throw new Error(msg)
      }
      current.value = (await res.json()) as Order
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  async function create(input: CreateOrderInput): Promise<Order> {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
      throw new Error(msg)
    }
    const created = (await res.json()) as Order
    return created
  }

  async function update(id: string, input: UpdateOrderInput): Promise<Order> {
    const res = await fetch(`/api/order/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
      throw new Error(msg)
    }
    const updated = (await res.json()) as Order
    return updated
  }

  async function remove(id: string): Promise<void> {
    const res = await fetch(`/api/order/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const msg = (await readErrorMessage(res)) ?? `HTTP ${res.status}`
      throw new Error(msg)
    }
  }

  async function readErrorMessage(res: Response): Promise<string | null> {
    try {
      const body = (await res.json()) as { error?: { message?: string } }
      return body.error?.message ?? null
    } catch {
      return null
    }
  }

  return {
    fetchAll,
    create,
    update: update as (id: string, input: any) => Promise<any>,
    remove: remove as (id: string) => Promise<void>,
  }
})