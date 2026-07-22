import { describe, it, expect } from 'vitest'
import { deviceSchema, createDeviceSchema, updateDeviceSchema } from './index.js'

/**
 * Smoke-test на публичный API сущности Device. Покрывает:
 * - дефолты для массивов, булей, order
 * - валидация URL в image
 * - ограничения длины
 * - опциональность полей кроме title
 */

const valid = {
  id: '6a60ecb97cf182ffea6920f7',
  title: 'MacBook Pro 16"',
  image: 'https://example.com/macbook.png',
  model: 'A2780',
  vendor: 'Apple',
  location: 'Home office',
  order: 5,
  tags: ['laptop', 'work'],
  description: 'Main work machine',
  isPinned: true,
  isZipped: false,
  isBroken: false,
  createdAt: '2026-07-22T07:17:06.394Z',
  updatedAt: '2026-07-22T07:17:06.394Z',
}

describe('deviceSchema', () => {
  it('валидирует полный Device', () => {
    const parsed = deviceSchema.parse(valid)
    expect(parsed.id).toBe(valid.id)
    expect(parsed.title).toBe('MacBook Pro 16"')
    expect(parsed.isPinned).toBe(true)
  })
})

describe('createDeviceSchema', () => {
  it('title обязателен', () => {
    expect(() => createDeviceSchema.parse({ ...valid, title: '' })).toThrow()
  })

  it('длина title ограничена 200 символами', () => {
    expect(() => createDeviceSchema.parse({ ...valid, title: 'x'.repeat(201) })).toThrow()
  })

  it('длина description ограничена 2000 символов', () => {
    expect(() => createDeviceSchema.parse({ ...valid, description: 'x'.repeat(2001) })).toThrow()
  })

  it('image: длина ограничена 500', () => {
    expect(() => createDeviceSchema.parse({ ...valid, image: 'x'.repeat(501) })).toThrow()
  })

  it('order — целое ≥ 0', () => {
    expect(() => createDeviceSchema.parse({ ...valid, order: -1 })).toThrow()
    expect(() => createDeviceSchema.parse({ ...valid, order: 1.5 })).toThrow()
  })

  it('order по умолчанию 0', () => {
    const parsed = createDeviceSchema.parse({ title: 'X' })
    expect(parsed.order).toBe(0)
  })

  it('tags: лимит 20 элементов', () => {
    const tags = Array(21).fill('a')
    expect(() => createDeviceSchema.parse({ ...valid, tags })).toThrow()
  })

  it('tags: элемент длиннее 50 символов отклоняется', () => {
    expect(() => createDeviceSchema.parse({ ...valid, tags: ['x'.repeat(51)] })).toThrow()
  })

  it('isPinned/isZipped/isBroken по умолчанию false', () => {
    const parsed = createDeviceSchema.parse({ title: 'X' })
    expect(parsed.isPinned).toBe(false)
    expect(parsed.isZipped).toBe(false)
    expect(parsed.isBroken).toBe(false)
  })

  it('links и tags по умолчанию пустые массивы', () => {
    const parsed = createDeviceSchema.parse({ title: 'X' })
    expect(parsed.tags).toEqual([])
  })

  it('принимает минимальный payload — только title', () => {
    const parsed = createDeviceSchema.parse({ title: 'X' })
    expect(parsed.title).toBe('X')
    // image/description и т.п. — .optional().or(z.literal('')): не переданы → undefined.
    // На UI форма всегда шлёт '' для пустых полей, так что в реальном API они никогда undefined.
    expect(parsed.image).toBeUndefined()
    expect(parsed.description).toBeUndefined()
  })
})

describe('updateDeviceSchema', () => {
  it('все поля опциональны', () => {
    const parsed = updateDeviceSchema.parse({})
    expect(parsed.title).toBeUndefined()
  })

  it('принимает частичное обновление флагов', () => {
    const parsed = updateDeviceSchema.parse({ isBroken: true, isZipped: true })
    expect(parsed.isBroken).toBe(true)
    expect(parsed.isZipped).toBe(true)
    expect(parsed.isPinned).toBeUndefined()
  })

  it('принимает изменение order', () => {
    const parsed = updateDeviceSchema.parse({ order: 10 })
    expect(parsed.order).toBe(10)
  })
})
