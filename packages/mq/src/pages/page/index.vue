<script setup lang="ts">
/**
 * Страницы (QPage)
 */

defineOptions({ name: 'UiPage' })

withDefaults(
  defineProps<{}>(),
  {},
)
</script>

<template>
  <q-page padding>
    <slot />
  </q-page>
</template>
