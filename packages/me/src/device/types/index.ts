import { z } from 'zod'

/**
 * Общая форма пользовательского ввода для Device — задаётся ОДИН раз.
 * Из неё собираются `createDeviceSchema` (== этот же), `updateDeviceSchema`
 * (partial) и `deviceSchema` (extend с серверными полями).
 *
 * Карточка техники: инвентаризация устройств (ноутбуки, телефоны, приставки и т.д.).
 */
const deviceInputSchema = z.object({
  title: z.string().min(1).max(200),
  // image — URL или относительный путь. На MVP просто строка, без загрузки файлов
  // (это отдельная задача — roadmap 18).
  image: z.string().max(500).optional().or(z.literal('')),
  model: z.string().max(100).optional().or(z.literal('')),
  vendor: z.string().max(100).optional().or(z.literal('')),
  location: z.string().max(200).optional().or(z.literal('')),
  // order — для ручной сортировки в списке. Неотрицательное целое.
  order: z.number().int().min(0).optional().default(0),
  tags: z.array(z.string().min(1).max(50)).max(20).optional().default([]),
  description: z.string().max(2000).optional().or(z.literal('')),
  isPinned: z.boolean().optional().default(false),
  isZipped: z.boolean().optional().default(false),
  isBroken: z.boolean().optional().default(false),
})

/** Тело POST /device — создание. */
export const createDeviceSchema = deviceInputSchema
export type CreateDeviceInput = z.infer<typeof createDeviceSchema>

/** Тело PATCH /device/:id — частичное обновление. */
export const updateDeviceSchema = createDeviceSchema.partial()
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>

/** Полная сущность Device — то, что возвращает API. */
export const deviceSchema = deviceInputSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type Device = z.infer<typeof deviceSchema>
