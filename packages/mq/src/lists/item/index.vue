<script setup lang="ts">
/**
 * Элемента списка (QItem)
 */

defineOptions({ name: 'UiListItem' })

const props = withDefaults(
  defineProps<{
    /**
     * Content Data
     */

     /**
      * Navigation
      */

      // Эквивалентно свойству 'to' в Vue Router (<router-link>); при использовании заменяется свойством 'href'.
      to?: string | object

      // Эквивалентно свойству 'exact' в Vue Router: `<router-link>`; при использовании заменяется свойством `href`.
      exact?: boolean

      /**
       * State
       */

      // Является ли QItem кликабельным? Если да, то он будет добавлять эффекты при наведении курсора и генерировать события «клик».
      clickable?: boolean
  }>(),
  {},
)

</script>

<template>
  <q-item v-bind="props">
    <slot />
  </q-item>
</template>
