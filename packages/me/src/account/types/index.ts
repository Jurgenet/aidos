import { z } from 'zod'

/**
 * Общая форма пользовательского ввода для Account — задаётся ОДИН раз.
 * Из неё собираются `createAccountSchema` (== этот же), `updateAccountSchema`
 * (partial) и `accountSchema` (extend с серверными полями).
 */
const accountInputSchema = z.object({
  title: z.string().min(1).max(200),
  // group опциональна — запись можно создать без категории.
  // Пустая строка трактуется как «нет группы» (форма шлёт '' для пустого поля).
  group: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  login: z.string().max(200).optional().or(z.literal('')),
  // password — хранится и возвращается as-is (без шифрования, MVP).
  password: z.string().max(500).optional(),
  link: z.string().url().optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
})

/** Тело POST /account — создание. */
export const createAccountSchema = accountInputSchema
export type CreateAccountInput = z.infer<typeof createAccountSchema>

/** Тело PATCH /account/:id — частичное обновление. */
export const updateAccountSchema = createAccountSchema.partial()
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>

/** Полная сущность Account — то, что возвращает API. */
export const accountSchema = accountInputSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type Account = z.infer<typeof accountSchema>
