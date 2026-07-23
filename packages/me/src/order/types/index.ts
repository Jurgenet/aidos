import { z } from 'zod'

/**
 * Базовая схема входных данных для Order — поля, которые приходят от клиента.
 * Из неё собираются `createOrderSchema` (== этот же), `updateOrderSchema`
 * (partial) и `orderSchema` (extend с серверными полями).
 */
const orderInputSchema = z.object({
  // date — дата заказа/создания
  date: z.coerce.date(),
  // group — группа/категория заказа
  group: z.string().min(1).max(100),
  // title — название заказа/товара
  title: z.string().min(1).max(200),
  // price — цена, число с 2 знаками после запятой
  price: z.number().min(0).multipleOf(0.01),
  // amount — количество (целое число)
  amount: z.number().int().min(1),
  // vendor — поставщик/производитель
  vendor: z.string().min(1).max(100),
  // seller — продавец/продавец
  seller: z.string().min(1).max(100),
  // link — ссылка на товар/заказ
  link: z.string().url().optional().or(z.literal('')),
  // tags — массив тегов
  tags: z.array(z.string().min(1).max(50)).max(20).optional().default([]),
  // description — свободный текст
  description: z.string().max(2000).optional().or(z.literal('')),
})

/** Тело POST /order — создание. */
export const createOrderSchema = orderInputSchema
export type CreateOrderInput = z.infer<typeof createOrderSchema>

/** Тело PATCH /order/:id — частичное обновление. */
export const updateOrderSchema = createOrderSchema.partial()
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>

/** Полная сущность Order — то, что возвращает API. */
export const orderSchema = orderInputSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type Order = z.infer<typeof orderSchema>
