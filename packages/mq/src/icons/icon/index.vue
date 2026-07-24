<script setup lang="ts">
/**
 * Базовый Icon (QIcon)
 */

 import { iconNames } from '../index.js'

defineOptions({ name: 'UiIcon' })

const props = withDefaults(
  defineProps<{
    /**
     * Content Data
     */
    name?: string
  }>(),
  {
    name: iconNames.star,
  },
)
</script>

<template>
  <q-icon v-bind="props" />
</template>
