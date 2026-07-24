<script setup lang="ts">
/**
 * Текстовый (заголовок) элемента списка (QItemLabel)
 */

defineOptions({ name: 'UiListItemLabel' })

const props = withDefaults(
  defineProps<{
    /**
     * Content Data
     */

    // Renders an overline label
    overline?: boolean

    // Renders a caption label
    caption?: boolean

    // Renders a header label
    header?: boolean

    /**
     * Behavior
     */

     // Apply ellipsis when there's not enough space to render on the specified number of lines;
    lines?: number | string
  }>(),
  {
    header: true,
  },
)
</script>

<template>
  <q-item-label v-bind="props">
    <slot />
  </q-item-label>
</template>
