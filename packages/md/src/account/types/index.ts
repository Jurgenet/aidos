import { z } from 'zod'

/**
 * Полная сущность Account — то, что возвращает API.
 * Менеджер учётных записей: логины/пароли, ссылки, группировка.
 */
export const accountSchema = z.object({
  id: z.string(),
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
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type Account = z.infer<typeof accountSchema>

/** Тело POST /account — создание. Без id и timestamps. */
export const createAccountSchema = z.object({
  title: z.string().min(1).max(200),
  group: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  login: z.string().max(200).optional().or(z.literal('')),
  password: z.string().max(500).optional(),
  link: z.string().url().optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
})
export type CreateAccountInput = z.infer<typeof createAccountSchema>

/** Тело PATCH /account/:id — частичное обновление. */
export const updateAccountSchema = createAccountSchema.partial()
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
