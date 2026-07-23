import { describe, it, expect } from 'vitest'
import { noteSchema, createNoteSchema, updateNoteSchema } from './index.js'

/**
 * Smoke-test на публичный API сущности Note. Покрывает:
 * - дефолты для массивов и буля
 * - валидация URL в links
 * - ограничения длины
 * - опциональность полей кроме title
 */

const valid = {
  id: '6a60ecb97cf182ffea6920f7',
  title: 'My Note',
  content: 'Some content',
  links: ['https://example.com'],
  tags: ['work', 'important'],
  isPinned: true,
  createdAt: '2026-07-22T07:17:06.394Z',
  updatedAt: '2026-07-22T07:17:06.394Z',
}

describe('noteSchema', () => {
  it('валидирует полную Note', () => {
    const parsed = noteSchema.parse(valid)
    expect(parsed.id).toBe(valid.id)
    expect(parsed.links).toEqual(['https://example.com'])
    expect(parsed.isPinned).toBe(true)
  })
})

describe('createNoteSchema', () => {
  it('title обязателен', () => {
    expect(() => createNoteSchema.parse({ ...valid, title: '' })).toThrow()
  })

  it('длина title ограничена 200 символами', () => {
    expect(() => createNoteSchema.parse({ ...valid, title: 'x'.repeat(201) })).toThrow()
  })

  it('длина content ограничена 10000 символов', () => {
    expect(() => createNoteSchema.parse({ ...valid, content: 'x'.repeat(10_001) })).toThrow()
  })

  it('links: отклоняет невалидный url', () => {
    expect(() => createNoteSchema.parse({ ...valid, links: ['not-a-url'] })).toThrow()
  })

  it('links: лимит 50 элементов', () => {
    const links = Array(51).fill('https://example.com')
    expect(() => createNoteSchema.parse({ ...valid, links })).toThrow()
  })

  it('tags: лимит 20 элементов', () => {
    const tags = Array(21).fill('a')
    expect(() => createNoteSchema.parse({ ...valid, tags })).toThrow()
  })

  it('tags: элемент длиннее 50 символов отклоняется', () => {
    expect(() => createNoteSchema.parse({ ...valid, tags: ['x'.repeat(51)] })).toThrow()
  })

  it('isPinned по умолчанию false', () => {
    const parsed = createNoteSchema.parse({ title: 'X' })
    expect(parsed.isPinned).toBe(false)
  })

  it('links и tags по умолчанию пустые массивы', () => {
    const parsed = createNoteSchema.parse({ title: 'X' })
    expect(parsed.links).toEqual([])
    expect(parsed.tags).toEqual([])
  })

  it('принимает минимальный payload — только title', () => {
    const parsed = createNoteSchema.parse({ title: 'X' })
    expect(parsed.title).toBe('X')
    expect(parsed.content).toBe('')
  })
})

describe('updateNoteSchema', () => {
  it('все поля опциональны', () => {
    const parsed = updateNoteSchema.parse({})
    expect(parsed.title).toBeUndefined()
  })

  it('принимает частичное обновление isPinned', () => {
    const parsed = updateNoteSchema.parse({ isPinned: true })
    expect(parsed.isPinned).toBe(true)
  })

  it('принимает замену tags', () => {
    const parsed = updateNoteSchema.parse({ tags: ['new'] })
    expect(parsed.tags).toEqual(['new'])
  })
})
