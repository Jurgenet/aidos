import { describe, it, expect } from 'vitest'
import { accountSchema, createAccountSchema, updateAccountSchema } from './index.js'

/**
 * Smoke-test на публичный API сущности Account.
 * Скоуп — только zod-схемы (без Mongoose и HTTP). См. аналогичный тест
 * для User: проверяем, что валидация входа и контракт не сломаны.
 */

const valid = {
  id: '6a606e722585a4411f8b7245',
  title: 'GitHub',
  group: 'Dev',
  email: 'me@example.com',
  login: 'octocat',
  password: 's3cret',
  link: 'https://github.com',
  description: 'Personal',
  createdAt: '2026-07-22T07:17:06.394Z',
  updatedAt: '2026-07-22T07:17:06.394Z',
}

describe('accountSchema', () => {
  it('валидирует полного Account', () => {
    const parsed = accountSchema.parse(valid)
    expect(parsed.id).toBe(valid.id)
    expect(parsed.title).toBe('GitHub')
    expect(parsed.createdAt).toBeInstanceOf(Date)
  })

  it('опциональные поля могут быть пустыми строками', () => {
    const parsed = accountSchema.parse({ ...valid, email: '', login: '', link: '', description: '' })
    expect(parsed.email).toBe('')
  })
})

describe('createAccountSchema', () => {
  it('title обязателен', () => {
    expect(() => createAccountSchema.parse({ ...valid, title: '' })).toThrow()
  })

  it('group опциональна — пустая строка и undefined оба проходят', () => {
    expect(() => createAccountSchema.parse({ ...valid, group: '' })).not.toThrow()
    expect(() => createAccountSchema.parse({ ...valid, group: undefined })).not.toThrow()
  })

  it('group ограничена 100 символами (когда задана)', () => {
    expect(() => createAccountSchema.parse({ ...valid, group: 'x'.repeat(101) })).toThrow()
  })

  it('длина title ограничена 200 символами', () => {
    expect(() => createAccountSchema.parse({ ...valid, title: 'x'.repeat(201) })).toThrow()
  })

  it('отклоняет невалидный email', () => {
    expect(() => createAccountSchema.parse({ ...valid, email: 'not-an-email' })).toThrow()
  })

  it('отклоняет невалидный url в link', () => {
    expect(() => createAccountSchema.parse({ ...valid, link: 'not-a-url' })).toThrow()
  })

  it('принимает минимальный payload — только title', () => {
    const parsed = createAccountSchema.parse({ title: 'X' })
    expect(parsed.title).toBe('X')
    expect(parsed.group).toBeUndefined()
  })
})

describe('updateAccountSchema', () => {
  it('все поля опциональны', () => {
    const parsed = updateAccountSchema.parse({})
    expect(parsed.title).toBeUndefined()
  })

  it('принимает частичное обновление одного поля', () => {
    const parsed = updateAccountSchema.parse({ group: 'Work' })
    expect(parsed.group).toBe('Work')
    expect(parsed.title).toBeUndefined()
  })
})
