<script setup lang="ts">
/**
 * Контейнер страницы (QPageContainer)
 */

defineOptions({ name: 'UiPageContainer' })

withDefaults(
  defineProps<{}>(),
  {},
)
</script>

<template>
  <q-page-container>
    <slot />
  </q-page-container>
</template>
