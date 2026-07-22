/**
 * Server-часть модуля Note: модель, сервис, контроллер, роутер.
 * Импортируется через `@aid/md/note/server` (apps/server).
 */
export { NoteModel } from './model.js'
export { noteService, NoteNotFoundError } from './service.js'
export { noteController } from './controller.js'
export { noteRouter } from './router.js'
