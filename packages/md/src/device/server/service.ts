import { Types } from 'mongoose'
import { DeviceModel } from './model.js'
import { HttpError } from '../../shared/http-error/index.js'
import type { Device, CreateDeviceInput, UpdateDeviceInput } from '../types/index.js'

/** 404 — устройство не найдено по id. */
export class DeviceNotFoundError extends HttpError {
  constructor(id: string) {
    super(404, `Device not found: ${id}`)
    this.name = 'DeviceNotFoundError'
  }
}

/**
 * Приводит документ Mongoose к `Device`.
 * Использует `any` для lean-документа.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDevice(doc: any): Device {
  return {
    id: String(doc._id),
    title: doc.title,
    image: doc.image,
    model: doc.model,
    vendor: doc.vendor,
    location: doc.location,
    order: doc.order,
    tags: doc.tags,
    description: doc.description,
    isPinned: doc.isPinned,
    isZipped: doc.isZipped,
    isBroken: doc.isBroken,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

/** Сервисный слой Device. Бросает доменные ошибки (наследники HttpError). */
export const deviceService = {
  async findById(id: string): Promise<Device> {
    if (!Types.ObjectId.isValid(id)) {
      throw new DeviceNotFoundError(id)
    }
    const doc = await DeviceModel.findById(id).lean()
    if (!doc) throw new DeviceNotFoundError(id)
    return toDevice(doc)
  },

  async list(filter: { tag?: string; isBroken?: boolean } = {}): Promise<Device[]> {
    // Строим query явно, чтобы undefined не превращался в WHERE field IS NULL.
    const query: Record<string, unknown> = {}
    if (filter.tag !== undefined) query.tags = filter.tag
    if (filter.isBroken !== undefined) query.isBroken = filter.isBroken
    const docs = await DeviceModel.find(query).lean()
    return docs.map(toDevice)
  },

  async create(input: CreateDeviceInput): Promise<Device> {
    const created = await DeviceModel.create(input)
    return toDevice(created.toObject())
  },

  async update(id: string, input: UpdateDeviceInput): Promise<Device> {
    if (!Types.ObjectId.isValid(id)) {
      throw new DeviceNotFoundError(id)
    }
    const doc = await DeviceModel.findByIdAndUpdate(id, input, { new: true }).lean()
    if (!doc) throw new DeviceNotFoundError(id)
    return toDevice(doc)
  },

  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new DeviceNotFoundError(id)
    }
    const result = await DeviceModel.findByIdAndDelete(id)
    if (!result) throw new DeviceNotFoundError(id)
  },
}
