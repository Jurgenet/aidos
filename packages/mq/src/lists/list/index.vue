<script setup lang="ts">
/**
 * Базовый List (QList)
 */

defineOptions({ name: 'UiList' })

withDefaults(
  defineProps<{
    /**
     * Data
     */
    separator?: boolean
    bordered?: boolean
  }>(),
  {},
)
</script>

<template>
  <q-list v-bind="$attrs">
    <slot />
  </q-list>
</template>
