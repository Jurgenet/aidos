import { Schema, model } from 'mongoose'

/**
 * Mongoose-схема Order.
 *
 * Поля:
 * - `date` — дата заказа/создания
 * - `group` — группа/категория заказа
 * - `title` — название заказа/товара
 * - `price` — цена, число с 2 знаками после запятой
 * - `amount` — количество (целое число)
 * - `vendor` — поставщик/производитель
 * - `seller` — продавец/продавец
 * - `link` — ссылка на товар/заказ
 * - `tags` — массив тегов
 * - `description` — свободный текст
 * - `createdAt`/`updatedAt` — опция `timestamps`
 */
const orderSchema = new Schema(
  {
    date: { type: Date, required: true },
    group: { type: String, required: true, minlength: 1, maxlength: 100 },
    title: { type: String, required: true, minlength: 1, maxlength: 200 },
    price: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 1 },
    vendor: { type: String, required: true, minlength: 1, maxlength: 100 },
    seller: { type: String, required: true, minlength: 1, maxlength: 100 },
    link: { type: String, required: false, default: '' },
    description: { type: String, required: false, default: '', maxlength: 2000 },
  },
  { timestamps: true },
)

export const OrderModel = model('Order', orderSchema)