<script setup lang="ts">
/**
 * Заголовок тулбара
 */

defineOptions({ name: 'UiToolbarTitle' })

withDefaults(
  defineProps<{}>(),
  {},
)
</script>

<template>
  <q-toolbar-title>
    <slot />
  </q-toolbar-title>
</template>
