<script setup lang="ts">
/**
 * Кнопка-ссылка
 */

import { UiListItem, UiListItemSection } from '@aid/mq/lists'

defineOptions({ name: 'UiDrawerLink' })

const props = withDefaults(
  defineProps<{
    /**
     * Custom Data
     */

    // надпись
    label: string

    // ссылка
    to: string

    // иконка слева от надписи
    icon?: string
  }>(),
  {},
)

</script>

<template>
  <UiListItem
    v-bind="props"
    v-ripple
    clickable
    exact
  >
    <slot />

    <UiListItemSection
      v-if="icon"
      :icon="icon"
    />

    <UiListItemSection :label="label" />
  </UiListItem>
</template>
