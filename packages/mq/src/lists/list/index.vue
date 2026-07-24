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

    // Applies a separator between contained items
    separator?: boolean

    // Applies a material design-like padding on top and bottom
    padding?: boolean

    // HTML tag to use
    tag?: string

    /**
     * Style
     */

    // Applies a default border to the component
    bordered?: boolean

    // Dense mode; occupies less space
    dense?: boolean

    // Notify the component that the background is a dark color
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
