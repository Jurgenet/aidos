import { z } from 'zod'

/** Роли пользователя. */
export const userRole = z.enum(['admin', 'user', 'manager'])
export type UserRole = z.infer<typeof userRole>

/** Массив всех ролей — удобно для `<select v-for>` и прочих перечислений. */
export const userRoleOptions = userRole.options

/**
 * Общая форма пользовательского ввода для User — задаётся ОДИН раз.
 * Из неё собираются `createUserSchema` (== этот же), `updateUserSchema`
 * (partial) и `userSchema` (extend с серверными полями).
 */
const userInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: userRole.optional().default('user'),
})

/** Тело POST /user — создание. */
export const createUserSchema = userInputSchema
export type CreateUserInput = z.infer<typeof createUserSchema>

/** Тело PATCH /user/:id — частичное обновление. */
export const updateUserSchema = createUserSchema.partial()
export type UpdateUserInput = z.infer<typeof updateUserSchema>

/** Полная сущность User — то, что возвращает API. */
export const userSchema = userInputSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type User = z.infer<typeof userSchema>
