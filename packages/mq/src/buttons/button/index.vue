<script setup lang="ts">
import { QBtn } from 'quasar'

defineOptions({ name: 'UiButton' })

/**
 * Кнопка. Обёртка над Quasar QBtn с дефолтами mq: `no-caps`, `rounded`, `color: primary`.
 */
withDefaults(
  defineProps<{
    /** Текст на кнопке. */
    label?: string
    /** Иконка слева от текста. Имя из иконсета (например `add`, `edit`, `delete`). */
    icon?: string
    /** Цвет из палитры Quasar (`primary`, `secondary`, `positive`, `negative`, `warning`, `info`) или любой CSS-цвет. */
    color?: string
    /** Показать спиннер загрузки и заблокировать клики. */
    loading?: boolean
    /** Заблокировать кнопку. */
    disable?: boolean
  }>(),
  { color: 'primary' },
)
</script>

<template>
  <QBtn
    no-caps
    rounded
    :label="label"
    :icon="icon"
    :color="color"
    :loading="loading"
    :disable="disable"
  >
    <slot />
  </QBtn>
</template>
