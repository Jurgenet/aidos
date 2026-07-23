<script setup lang="ts">
import { QCheckbox } from 'quasar'

defineOptions({ name: 'UiCheckbox' })

const model = defineModel<boolean>()

/**
 * Чекбокс. Обёртка над Quasar QCheckbox с дефолтом mq: `dense`.
 * v-model через `defineModel<boolean>()`.
 *
 * Создан, чтобы вынести Quasar-зависимость из форм @aid/me —
 * раньше приходилось использовать сырой <q-checkbox>, который
 * не ресолвился в workspace-пакетах, собираемых без Quasar-плагина.
 */
withDefaults(
  defineProps<{
    /** Значение. Двусторонняя привязка через v-model. */
    modelValue?: boolean
    /** Подпись справа от чекбокса. */
    label?: string
    /** Заблокировать переключение. */
    disable?: boolean
  }>(),
  {},
)
</script>

<template>
  <QCheckbox
    v-model="model"
    dense
    :label="label"
    :disable="disable"
  />
</template>
