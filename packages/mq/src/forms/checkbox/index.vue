<script setup lang="ts">
/**
 * Базовый чекбокс (QCheckbox)
 */

defineOptions({ name: 'UiCheckbox' })

const model = defineModel<boolean>()

withDefaults(
  defineProps<{
    /**
     * Content Data
     */
    modelValue?: boolean

    // Подпись справа от чекбокса
    label?: string

    /**
     * Style
     */
    disable?: boolean
  }>(),
  {},
)
</script>

<template>
  <q-checkbox
    v-model="model"
    dense
  />
</template>
