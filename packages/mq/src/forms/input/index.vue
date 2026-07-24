<script setup lang="ts">
/**
 * Базовое поле ввода (QInput)
 */

defineOptions({ name: 'UiInput' })

const model = defineModel<string | number | null>()

withDefaults(
  defineProps<{
    /**
     * Data
     */
    modelValue?: string | number | null
    // Плавающая подпись над полем
    label?: string
    // Плейсхолдер — текст-подсказка, когда поле пустое
    placeholder?: string
    // Подсказка под полем (нейтральная, не ошибка)
    hint?: string

    /**
     * Behavior
     */

    // Тип HTML-инпута. Влияет на клавиатуру на мобильных и валидацию браузера
    type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search'

    /**
     * Styles
     */

    // Заблокировать ввод и клики по полю
    disable?: boolean
    // Только для чтения — пользователь не может менять значение, но может выделить/скопировать
    readonly?: boolean
    // Флаг ошибки — подсвечивает поле красным и показывает `errorMessage`
    error?: boolean
    // Текст ошибки под полем. Показывается, если `error: true`
    errorMessage?: string
  }>(),
  {
    type: 'text',
  },
)
</script>

<template>
  <q-input
    v-model="model"
    outlined
    dense
  >
    <slot />
  </q-input>
</template>
