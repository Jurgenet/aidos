<script setup lang="ts">
import { QToolbarTitle } from 'quasar'

defineOptions({ name: 'UiToolbarTitle' })

/**
 * Заголовок тулбара. Обёртка над Quasar QToolbarTitle.
 * Прокидывает слот для кастомного содержимого заголовка.
 */
withDefaults(
  defineProps<{}>(),
  {},
)
</script>

<template>
  <QToolbarTitle>
    <slot />
  </QToolbarTitle>
</template>
