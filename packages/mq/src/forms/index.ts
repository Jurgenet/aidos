/**
 * Поле ввода — `UiInput`. Обёртка над Quasar QInput с дефолтами mq
 * (`outlined`, `dense`), v-model через `defineModel`.
 */
export { default as UiInput } from './input/index.vue'

/**
 * Чекбокс — `UiCheckbox`. Обёртка над Quasar QCheckbox с дефолтом `dense`,
 * v-model через `defineModel<boolean>()`.
 */
export { default as UiCheckbox } from './checkbox/index.vue'
