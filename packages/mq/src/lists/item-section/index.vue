<script setup lang="ts">
/**
 * Секция элемента списка (QItemSection)
 */

import { computed } from 'vue'

import { UiIcon } from '../../icons'

defineOptions({ name: 'UiListItemSection' })

const props = withDefaults(
  defineProps<{
    /**
     * Custom Props
     */

    // Текс для слота
    label?: string

    // Иконка
    icon?: string


    /**
     * Native Props
     */
    // Отображение элемента аватара сбоку (для этого не требуется устанавливать свойство 'side').
    avatar?: boolean

    // Отображение миниатюры сбоку (свойство 'side' задавать не обязательно).
    thumbnail?: boolean

    // Отображается как боковая часть элемента.
    side?: boolean

    // Выравнивание содержимого по верхнему краю (полезно для многострочных элементов)
    top?: boolean

    // Не переносить текст (полезно для основного содержимого элемента)
    noWrap?: boolean
  }>(),
  {},
)

// Выставляем аватар-мод если пришла иконка
const isAvatar = computed(() => props.avatar || Boolean(props.icon))

</script>

<template>
  <q-item-section v-bind="{ ...props, avatar: isAvatar }">
    <UiIcon v-if="icon" :name="icon" />
    <slot v-if="!label" />
    <div v-else>{{ label }}</div>
  </q-item-section>
</template>
