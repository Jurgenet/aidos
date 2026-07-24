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

    // Метка над основным текстом
    overline?: boolean

    // Подпись
    caption?: boolean

    // Заголовок
    header?: boolean

    /**
     * Behavior
     */

     // Многоточие при нехватке места для отображения на заданном количестве строк
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
