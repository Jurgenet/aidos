import { noteService } from './service.js'
import { createNoteSchema, updateNoteSchema } from '../types/index.js'
import { createCrudController } from '../../shared/crud-controller.js'

/**
 * Контроллер Note — собран через общий `createCrudController` factory.
 * Экстрактор query-параметров: `isPinned` (`'true'/'false'`) и `tag`.
 */
export const noteController = createCrudController(
  noteService,
  { create: createNoteSchema, update: updateNoteSchema },
  (query) => {
    const q = query as Record<string, unknown>
    const isPinnedRaw = q['isPinned']
    const isPinned = typeof isPinnedRaw === 'string' ? isPinnedRaw === 'true' : undefined
    const tagRaw = q['tag']
    const tag = typeof tagRaw === 'string' ? tagRaw : undefined
    return { isPinned, tag } as { isPinned?: boolean; tag?: string }
  },
)
