import { Types } from 'mongoose'
import { OrderModel } from './model.js'
import { HttpError } from '../../shared/http-error/index.js'
import type { Order, CreateOrderInput, UpdateOrderInput } from '../types/index.js'

/** 404 — заказ не найден по id. */
export class OrderNotFoundError extends HttpError {
  constructor(id: string) {
    super(404, `Order not found: ${id}`)
    this.name = 'OrderNotFoundError'
  }
}

/**
 * Приводит документ Mongoose к `Order`.
 * Использует `any` для lean-документа, т.к. типы Mongoose lean сильно зашумлены.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toOrder(doc: any): Order {
  return {
    id: String(doc._id),
    date: doc.date,
    group: doc.group,
    title: doc.title,
    price: doc.price,
    amount: doc.amount,
    vendor: doc.vendor,
    seller: doc.seller,
    link: doc.link,
    tags: doc.tags,
    description: doc.description,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

/** Сервисный слой Order. Бросает доменные ошибки (наследники HttpError). */
export const orderService = {
  async findById(id: string): Promise<Order> {
    if (!Types.ObjectId.isValid(id)) {
      throw new OrderNotFoundError(id)
    }
    const doc = await OrderModel.findById(id).lean()
    if (!doc) throw new OrderNotFoundError(id)
    return toOrder(doc)
  },

  async list(filter: { seller?: string; vendor?: string } = {}): Promise<Order[]> {
    // Mongoose трактует `undefined` в фильтре как `WHERE field IS NULL`,
    // а не как «игнорировать поле». Поэтому строим query явно — кладём
    // только заданные ключи.
    const query: Record<string, unknown> = {}
    if (filter.seller !== undefined) query.seller = filter.seller
    if (filter.vendor !== undefined) query.vendor = filter.vendor
    const docs = await OrderModel.find(query).lean()
    return docs.map(toOrder)
  },

  async create(input: CreateOrderInput): Promise<Order> {
    const created = await OrderModel.create(input)
    return toOrder(created.toObject())
  },

  async update(id: string, input: UpdateOrderInput): Promise<Order> {
    if (!Types.ObjectId.isValid(id)) {
      throw new OrderNotFoundError(id)
    }
    const doc = await OrderModel.findByIdAndUpdate(id, input, { new: true }).lean()
    if (!doc) throw new OrderNotFoundError(id)
    return toOrder(doc)
  },

  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new OrderNotFoundError(id)
    }
    const result = await OrderModel.findByIdAndDelete(id)
    if (!result) throw new OrderNotFoundError(id)
  },
}