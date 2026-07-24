<script setup lang="ts">
/**
 * Layout
 */

defineOptions({ name: 'UiLayout' })

const props = withDefaults(
  defineProps<{

    /**
     * Content Data
     */

    // Определяет, как должны располагаться компоненты макета (заголовок/нижний колонтитул/выдвижная панель)
    view?: string

    // Контейнеризация макета означает изменение поведения по умолчанию, заключающегося в разворачивании на всё окно;
    // полезно (но не ограничивается этим) при использовании в QDialog.
    container?: boolean

  }>(),
  {
    view: 'hHh Lpr lFf',
  },
)
</script>

<template>
  <q-layout v-bind="props">
    <slot />
  </q-layout>
</template>
