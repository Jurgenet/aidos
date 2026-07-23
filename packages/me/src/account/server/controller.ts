import { accountService } from './service.js'
import { createAccountSchema, updateAccountSchema } from '../types/index.js'
import { createCrudController } from '../../shared/crud-controller.js'

/**
 * Контроллер Account — собран через общий `createCrudController` factory.
 * Специфичен только экстрактор query-параметра `group`.
 */
export const accountController = createCrudController(
  accountService,
  { create: createAccountSchema, update: updateAccountSchema },
  (query) => {
    const group = (query as Record<string, unknown>)['group']
    return { group: typeof group === 'string' ? group : undefined } as {
      group?: string
    }
  },
)
