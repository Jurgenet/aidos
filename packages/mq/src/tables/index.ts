/**
 * Таблица — `UiTable`. Обёртка над Quasar QTable с дефолтами mq
 * (`flat`, `bordered`). Дженерик `T` — тип строки. Дополнительный экспорт
 * `QTableColumn` для типизации колонок.
 */
export { default as UiTable } from './table/index.vue'
export type { QTableColumn } from 'quasar'
