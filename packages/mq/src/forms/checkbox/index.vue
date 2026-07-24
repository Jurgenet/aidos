<script setup lang="ts">
/**
 * Базовый чекбокс (QCheckbox)
 */

defineOptions({ name: 'UiCheckbox' })

const model = defineModel<boolean>()

withDefaults(
  defineProps<{
    /**
     * Data
     */
    modelValue?: boolean

    // Подпись справа от чекбокса
    label?: string

    /**
     * Styles
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
