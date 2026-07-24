<script setup lang="ts">
/**
 * Базовый List (QList)
 */

import { UiListItemLabel } from '../index.js'

defineOptions({ name: 'UiList' })

const props = withDefaults(
  defineProps<{
    /**
     * Customs
     */

    topic?: string

    /**
     * Content Data
     */

    // Разделитель между элементами
    separator?: boolean

    // Отступ сверху и снизу в стиле Material Design
    padding?: boolean

    // HTML-тег
    tag?: string

    /**
     * Style
     */

    // Граница компонента
    bordered?: boolean

    // Плотный режим; занимает меньше места
    dense?: boolean

    // Тёмный фон компонента
    dark?: boolean | null
  }>(),
  {},
)
</script>

<template>
  <q-list v-bind="props">
    <UiListItemLabel v-if="topic">{{ topic }}</UiListItemLabel>

    <slot />
  </q-list>
</template>
