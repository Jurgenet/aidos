import { describe, it, expect } from 'vitest'
import { userSchema, createUserSchema, updateUserSchema, userRole, userRoleOptions } from './index.js'

/**
 * Smoke-test на публичный API сущности User.
 *
 * Скоуп: только zod-схемы и enum-объекты (чистые данные, без Mongoose и
 * HTTP). Этого хватает для проверки «контракт API не сломан» — валидация
 * входных payload'ов и преобразование типов работают как задокументировано.
 *
 * Интеграционные тесты (create/findById/list через userService) добавим
 * отдельным шагом, когда подключим mongodb-memory-server.
 */

describe('userRole enum', () => {
  it('содержит ровно admin/user/manager', () => {
    expect(userRole.options).toEqual(['admin', 'user', 'manager'])
  })

  it('userRoleOptions — alias для options (для v-for)', () => {
    expect(userRoleOptions).toEqual(userRole.options)
  })
})

describe('userSchema', () => {
  it('валидирует полного User', () => {
    const valid = {
      id: '6a606e722585a4411f8b7245',
      email: 'test@example.com',
      name: 'Test',
      role: 'user',
      createdAt: '2026-07-22T07:17:06.394Z',
      updatedAt: '2026-07-22T07:17:06.394Z',
    }
    const parsed = userSchema.parse(valid)
    expect(parsed.id).toBe(valid.id)
    expect(parsed.role).toBe('user')
    expect(parsed.createdAt).toBeInstanceOf(Date)
  })

  it('отклоняет невалидный email', () => {
    const result = userSchema.safeParse({
      id: 'x',
      email: 'not-an-email',
      name: 'Test',
      role: 'user',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    })
    expect(result.success).toBe(false)
  })

  it('отклоняет неизвестную роль', () => {
    const result = userSchema.safeParse({
      id: 'x',
      email: 'a@b.com',
      name: 'Test',
      role: 'superuser',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    })
    expect(result.success).toBe(false)
  })
})

describe('createUserSchema', () => {
  it('принимает минимальный payload — role по умолчанию "user"', () => {
    const parsed = createUserSchema.parse({ email: 'a@b.com', name: 'Name' })
    expect(parsed.role).toBe('user')
  })

  it('принимает явную роль', () => {
    const parsed = createUserSchema.parse({ email: 'a@b.com', name: 'Name', role: 'admin' })
    expect(parsed.role).toBe('admin')
  })

  it('отклоняет пустое имя', () => {
    const result = createUserSchema.safeParse({ email: 'a@b.com', name: '' })
    expect(result.success).toBe(false)
  })

  it('отклоняет имя длиннее 100 символов', () => {
    const result = createUserSchema.safeParse({ email: 'a@b.com', name: 'x'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('отклоняет невалидный email', () => {
    const result = createUserSchema.safeParse({ email: 'no-at-sign', name: 'Name' })
    expect(result.success).toBe(false)
  })
})

describe('updateUserSchema', () => {
  it('все поля опциональны', () => {
    const parsed = updateUserSchema.parse({})
    expect(parsed.email).toBeUndefined()
    expect(parsed.name).toBeUndefined()
    expect(parsed.role).toBeUndefined()
  })

  it('принимает частичное обновление — только email', () => {
    const parsed = updateUserSchema.parse({ email: 'new@b.com' })
    expect(parsed.email).toBe('new@b.com')
    expect(parsed.name).toBeUndefined()
    expect(parsed.role).toBeUndefined()
  })

  it('принимает частичное обновление — только role', () => {
    const parsed = updateUserSchema.parse({ role: 'manager' })
    expect(parsed.role).toBe('manager')
  })

  it('отклоняет невалидные значения в частичном обновлении', () => {
    const result = updateUserSchema.safeParse({ email: 'bad' })
    expect(result.success).toBe(false)
  })
})
