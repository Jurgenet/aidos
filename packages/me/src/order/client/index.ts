/**
 * Client-часть модуля Order: Pinia-store + Vue-форма.
 * Импортируется через `@aid/me/order/client` (apps/client).
 */
export { useOrderStore } from './store.js'
export { default as OrderForm } from './form.vue'