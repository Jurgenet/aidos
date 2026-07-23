<script setup lang="ts">
import { QToolbar } from 'quasar'
import { UiToolbarTitle } from '../index.js'

defineOptions({ name: 'UiToolbar' })

/**
 * Тулбар. Обёртка над Quasar QToolbar.
 * По умолчанию рендерит заголовок `title` и версию `version`,
 * а также пробрасывает слот для действий слева/справа.
 */
withDefaults(
  defineProps<{
    /** Заголовок тулбара. По умолчанию `AID`. */
    title?: string
    /** Версия, отображаемая в правом углу тулбара. По умолчанию `0.0.0`. */
    version?: string
  }>(),
  {
    title: 'AID',
    version: '0.0.0',
  },
)
</script>

<template>
  <QToolbar>
    <slot />
    <UiToolbarTitle>{{title}}</UiToolbarTitle>
    <div>v{{ version }}</div>
  </QToolbar>
</template>
