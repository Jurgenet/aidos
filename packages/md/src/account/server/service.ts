import { Types } from 'mongoose'
import { AccountModel } from './model.js'
import { HttpError } from '../../http-error/index.js'
import type { Account, CreateAccountInput, UpdateAccountInput } from '../types/index.js'

/** 404 — аккаунт не найден по id (или id невалидный ObjectId). */
export class AccountNotFoundError extends HttpError {
  constructor(id: string) {
    super(404, `Account not found: ${id}`)
    this.name = 'AccountNotFoundError'
  }
}

/**
 * Приводит документ Mongoose к `Account` (id вместо _id, без служебных полей).
 * Использует `any` для lean-документа, т.к. типы Mongoose lean сильно зашумлены.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toAccount(doc: any): Account {
  return {
    id: String(doc._id),
    title: doc.title,
    group: doc.group,
    email: doc.email,
    login: doc.login,
    // password приходит только если запросили явно (+password) — иначе undefined.
    password: doc.password,
    link: doc.link,
    description: doc.description,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

/** Сервисный слой Account. Бросает доменные ошибки (наследники HttpError). */
export const accountService = {
  async findById(id: string): Promise<Account> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AccountNotFoundError(id)
    }
    const doc = await AccountModel.findById(id).lean()
    if (!doc) throw new AccountNotFoundError(id)
    return toAccount(doc)
  },

  async list(filter: { group?: string } = {}): Promise<Account[]> {
    // Аналогично User: строим query явно, чтобы undefined-значения
    // не превращались в WHERE field IS NULL.
    const query: Record<string, unknown> = {}
    if (filter.group !== undefined) query.group = filter.group
    const docs = await AccountModel.find(query).lean()
    return docs.map(toAccount)
  },

  async create(input: CreateAccountInput): Promise<Account> {
    const created = await AccountModel.create(input)
    return toAccount(created.toObject())
  },

  async update(id: string, input: UpdateAccountInput): Promise<Account> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AccountNotFoundError(id)
    }
    const doc = await AccountModel.findByIdAndUpdate(id, input, { new: true }).lean()
    if (!doc) throw new AccountNotFoundError(id)
    return toAccount(doc)
  },

  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AccountNotFoundError(id)
    }
    const result = await AccountModel.findByIdAndDelete(id)
    if (!result) throw new AccountNotFoundError(id)
  },
}
