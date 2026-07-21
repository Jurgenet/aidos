import { Types } from 'mongoose'
import { UserModel } from './model.js'
import { HttpError } from '../../http-error/index.js'
import type { User, CreateUserInput, UpdateUserInput, UserRole } from '../types/index.js'

/** 404 — пользователь не найден по id (или id невалидный ObjectId). */
export class UserNotFoundError extends HttpError {
  constructor(id: string) {
    super(404, `User not found: ${id}`)
    this.name = 'UserNotFoundError'
  }
}

/** 409 — email уже занят другим пользователем. */
export class UserAlreadyExistsError extends HttpError {
  constructor(email: string) {
    super(409, `User with email already exists: ${email}`)
    this.name = 'UserAlreadyExistsError'
  }
}

/**
 * Приводит документ Mongoose к `User` (id вместо _id, без служебных полей).
 * Использует `any` для lean-документа, т.к. типы Mongoose lean сильно зашумлены.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toUser(doc: any): User {
  return {
    id: String(doc._id),
    email: doc.email,
    name: doc.name,
    role: doc.role as UserRole,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

/** Сервисный слой User. Бросает доменные ошибки (наследники HttpError). */
export const userService = {
  async findById(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new UserNotFoundError(id)
    }
    const doc = await UserModel.findById(id).lean()
    if (!doc) throw new UserNotFoundError(id)
    return toUser(doc)
  },

  async list(filter: { role?: UserRole } = {}): Promise<User[]> {
    // Mongoose трактует `undefined` в фильтре как `WHERE field IS NULL`,
    // а не как «игнорировать поле». Поэтому строим query явно — кладём
    // только заданные ключи.
    const query: Record<string, unknown> = {}
    if (filter.role !== undefined) query.role = filter.role
    const docs = await UserModel.find(query).lean()
    return docs.map(toUser)
  },

  async create(input: CreateUserInput): Promise<User> {
    const existing = await UserModel.findOne({ email: input.email }).lean()
    if (existing) throw new UserAlreadyExistsError(input.email)
    const created = await UserModel.create(input)
    return toUser(created.toObject())
  },

  async update(id: string, input: UpdateUserInput): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new UserNotFoundError(id)
    }
    const doc = await UserModel.findByIdAndUpdate(id, input, { new: true }).lean()
    if (!doc) throw new UserNotFoundError(id)
    return toUser(doc)
  },

  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new UserNotFoundError(id)
    }
    const result = await UserModel.findByIdAndDelete(id)
    if (!result) throw new UserNotFoundError(id)
  },
}
