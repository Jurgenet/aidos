import { deviceService } from './service.js'
import { createDeviceSchema, updateDeviceSchema } from '../types/index.js'
import { createCrudController } from '../../shared/crud-controller.js'

/**
 * Контроллер Device — собран через общий `createCrudController` factory.
 * Экстрактор query: `tag` и `isBroken` (`'true'/'false'`).
 */
export const deviceController = createCrudController(
  deviceService,
  { create: createDeviceSchema, update: updateDeviceSchema },
  (query) => {
    const q = query as Record<string, unknown>
    const tagRaw = q['tag']
    const tag = typeof tagRaw === 'string' ? tagRaw : undefined
    const isBrokenRaw = q['isBroken']
    const isBroken = typeof isBrokenRaw === 'string' ? isBrokenRaw === 'true' : undefined
    return { tag, isBroken } as { tag?: string; isBroken?: boolean }
  },
)
