<script setup lang="ts">
/**
 * Базовый Drawer (QDrawer)
 */

defineOptions({ name: 'UiDrawer' })

const model = defineModel<boolean>()

withDefaults(
  defineProps<{
    /**
     * Content Data
     */

    modelValue?: boolean
  }>(),
  {},
)
</script>

<template>
  <q-drawer
    v-model="model"
    show-if-above
    bordered
  >
    <slot />
  </q-drawer>
</template>
