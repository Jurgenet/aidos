import { z } from 'zod'

/** Роли пользователя. */
export const userRole = z.enum(['admin', 'user', 'manager'])
export type UserRole = z.infer<typeof userRole>

/** Массив всех ролей — удобно для `<select v-for>` и прочих перечислений. */
export const userRoleOptions = userRole.options

/** Полная сущность User — то, что возвращает API. */
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: userRole,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type User = z.infer<typeof userSchema>

/** Тело POST /user — создание. Без id и timestamps (генерирует сервер). */
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: userRole.optional().default('user'),
})
export type CreateUserInput = z.infer<typeof createUserSchema>

/** Тело PATCH /user/:id — частичное обновление. */
export const updateUserSchema = createUserSchema.partial()
export type UpdateUserInput = z.infer<typeof updateUserSchema>
