<script setup lang="ts">
import { QInput } from 'quasar'

defineOptions({ name: 'UiInput' })

const model = defineModel<string | number | null>()

/**
 * Поле ввода. Обёртка над Quasar QInput с дефолтами mq: `outlined`, `dense`.
 * Поддерживает v-model через `defineModel`.
 */
withDefaults(
  defineProps<{
    /** Значение поля. Двусторонняя привязка через v-model. */
    modelValue?: string | number | null
    /** Плавающая подпись над полем. */
    label?: string
    /** Плейсхолдер — текст-подсказка, когда поле пустое. */
    placeholder?: string
    /** Тип HTML-инпута. Влияет на клавиатуру на мобильных и валидацию браузера. */
    type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search'
    /** Подсказка под полем (нейтральная, не ошибка). */
    hint?: string
    /** Заблокировать ввод и клики по полю. */
    disable?: boolean
    /** Только для чтения — пользователь не может менять значение, но может выделить/скопировать. */
    readonly?: boolean
    /** Флаг ошибки — подсвечивает поле красным и показывает `errorMessage`. */
    error?: boolean
    /** Текст ошибки под полем. Показывается, если `error: true`. */
    errorMessage?: string
  }>(),
  { type: 'text' },
)
</script>

<template>
  <QInput
    v-model="model"
    outlined
    dense
    :label="label"
    :placeholder="placeholder"
    :type="type"
    :hint="hint"
    :disable="disable"
    :readonly="readonly"
    :error="error"
    :error-message="errorMessage"
  >
    <slot />
  </QInput>
</template>
