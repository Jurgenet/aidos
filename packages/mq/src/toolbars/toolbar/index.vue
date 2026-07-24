<script setup lang="ts">
/**
 * Базовый Тулбар
 */

import { UiToolbarTitle } from '../index.js'

defineOptions({ name: 'UiToolbar' })

withDefaults(
  defineProps<{
    /**
     * Custom
     */
    title?: string
    // Версия, отображаемая в правом углу тулбара
    version?: string
  }>(),
  {
    title: 'AID',
    version: '0.0.0',
  },
)
</script>

<template>
  <q-toolbar>
    <slot />
    <UiToolbarTitle>{{title}}</UiToolbarTitle>
    <div>v{{ version }}</div>
  </q-toolbar>
</template>
