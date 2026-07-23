import { orderService } from './service.js'
import { createOrderSchema, updateOrderSchema } from '../types/index.js'
import { createCrudController } from '../../shared/crud-controller.js'

/**
 * Контроллер Order — собран через общий `createCrudController` factory.
 * Специфичен только экстрактор query-параметров `seller` и `vendor`.
 */
export const orderController = createCrudController(
  orderService,
  { create: createOrderSchema, update: updateOrderSchema },
  (query) => {
    const q = query as Record<string, unknown>
    const sellerRaw = q['seller']
    const seller = typeof sellerRaw === 'string' ? sellerRaw : undefined
    const vendorRaw = q['vendor']
    const vendor = typeof vendorRaw === 'string' ? vendorRaw : undefined
    return { seller, vendor } as { seller?: string; vendor?: string }
  },
)