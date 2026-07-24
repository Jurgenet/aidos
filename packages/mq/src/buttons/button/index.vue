<script setup lang="ts">
/**
 * Базовая Кнопка (QBtn)
 */

import { computed } from 'vue'

defineOptions({ name: 'UiButton' })

const props = withDefaults(
  defineProps<{
    /**
     * Customs
     */
    tooltip?: string

    // class?: string # reserved word

    /**
     * Data
     */

    // Текст на кнопке
    label?: string

    /**
     * Behavior
     */

    // Эквивалентно Vue Router <router-link> свойству 'to'; Заменяется свойством 'href', если используется
    to?: string

    // Собственный атрибут ссылки <a> href; имеет приоритет над свойствами «to» и «replace».
    // example: '/home/dashboard' | { name: 'my-route-name' }
    href?: string

    // Собственный целевой атрибут ссылки <a>; используйте его только с параметрами «to» или «href»
    // example: '_blank' | '_self' | '_parent' | '_top'
    target?: string

    // Эквивалентно Vue Router <router-link> свойству 'replace'; Заменяется свойством 'href', если используется
    replace?: boolean

    // Тип кнопки
    // 1 Определите атрибут собственного типа кнопки
    // 2. Рендерит компонент с тегом <a> так что вы можете получить доступ к событиям даже если отключены
    // 3. Используйте свойство «href» и укажите «type» в качестве тега мультимедиа.
    // example: 'a' | 'submit' | 'button' | 'reset' | 'image/png' | # href="https://quasar.dev" target="_blank"
    // default: 'button'
    type?: string;

    /**
     * Styles
     */
    size?: string
    align?: 'left' | 'right' | 'between' | 'around' | 'center' | 'evenly'
    ariaLabel?: string
    icon?: string
    iconLeft?: string
    iconRight?: string
    side?: string
    textColor?: string
    color?: string
    padding?: string
    style?: string
    percentage?: number
    // No capitalizing label
    noCaps?: boolean
    // icon under text
    stack?: boolean
    // Окантовка (Бордер)
    // work only with flat = false
    outline?: boolean
    // Плоская (без визуальной глубины)
    flat?: boolean
    dense?: boolean
    round?: boolean
    rounded?: boolean
    // Прямоугольные углы (без скругления углов)
    square?: boolean
    // full-height in container
    stretch?: boolean
    unelevated?: boolean
    glossy?: boolean
    disable?: boolean
    loading?: boolean
    darkPercentage?: boolean
    ripple?: boolean | { color: string, center: boolean }
  }>(),
  {
    size: '12px',
    flat: false,
    loading: false,
  },
)

const flat = computed(() => props.outline ? false : props.flat)

</script>

<template>
  <q-btn
    v-bind="{...$attrs, ...props }"
    :flat="flat"
  >
    <slot />

    <q-tooltip v-if="tooltip">{{ tooltip }}</q-tooltip>

    <template v-slot:loading>
      <q-spinner-facebook />
    </template>

  </q-btn>
</template>
