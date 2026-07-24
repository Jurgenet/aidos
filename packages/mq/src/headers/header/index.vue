<script setup lang="ts">
/**
 * Базовый Header (QHeader)
 */

defineOptions({ name: 'UiHeader' })

withDefaults(
  defineProps<{}>(),
  {},
)
</script>

<template>
  <q-header elevated>
    <slot />
  </q-header>
</template>
