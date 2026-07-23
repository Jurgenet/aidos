import type { RequestHandler } from 'express'
import type { z } from 'zod'

/**
 * Контракт сервиса, который «понимает» `createCrudController`.
 * Любой сервис с такой сигнатурой может обернуться в стандартный
 * набор из 5 RequestHandler'ов.
 */
export interface CrudService<T, TCreate, TUpdate, TFilter = unknown> {
  findById(id: string): Promise<T>
  list(filter: TFilter): Promise<T[]>
  create(input: TCreate): Promise<T>
  update(id: string, input: TUpdate): Promise<T>
  delete(id: string): Promise<void>
}

/** Пары zod-схем для create/update — передаются в фабрику. */
export interface CrudSchemas<TCreate, TUpdate> {
  create: z.ZodType<TCreate>
  update: z.ZodType<TUpdate>
}

/**
 * Создаёт набор из 5 RequestHandler'ов — getById/list/create/update/delete —
 * поверх произвольного сервиса и zod-схем.
 *
 * List-фильтр извлекается переданной `extractFilter` функцией, потому что
 * query-параметры у разных сущностей разные (User: ?role=..., Account:
 * ?group=..., Note: ?isPinned=true&tag=...).
 *
 * Не экспортируется в `package.json` — это внутренняя утилита @aid/me.
 */
export function createCrudController<T, TCreate, TUpdate, TFilter>(
  service: CrudService<T, TCreate, TUpdate, TFilter>,
  schemas: CrudSchemas<TCreate, TUpdate>,
  extractFilter: (query: unknown) => TFilter,
) {
  return {
    getById: (async (req, res) => {
      const entity = await service.findById(req.params['id'] as string)
      res.json(entity)
    }) as RequestHandler,

    list: (async (req, res) => {
      const items = await service.list(extractFilter(req.query))
      res.json({ items, total: items.length })
    }) as RequestHandler,

    create: (async (req, res) => {
      const input = schemas.create.parse(req.body)
      const entity = await service.create(input)
      res.status(201).json(entity)
    }) as RequestHandler,

    update: (async (req, res) => {
      const input = schemas.update.parse(req.body)
      const entity = await service.update(req.params['id'] as string, input)
      res.json(entity)
    }) as RequestHandler,

    delete: (async (req, res) => {
      await service.delete(req.params['id'] as string)
      res.status(204).end()
    }) as RequestHandler,
  }
}
