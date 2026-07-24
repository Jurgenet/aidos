<script setup lang="ts" generic="T extends object">
/**
 * Базовая таблица (QTable) с дефолтами mq: `flat`, `bordered`
 * Дженерик `T` — тип строки, прокидывается в `columns` для типизации `field`
 */

import { type QTableColumn } from 'quasar'

defineOptions({ name: 'UiTable' })

const props = withDefaults(
  defineProps<{
    /**
     * Data
     */

    // Массив строк данных
    rows: T[]
    // Описание колонок — Quasar QTableColumn<T>[]
    columns: QTableColumn<T>[]
    // Имя поля, однозначно идентифицирующего строку. Используется для трекинга выбора и обновлений
    rowKey?: string

    /**
     * Behavior
     */

    // Строка фильтрации. Применяется ко всем колонкам автоматически
    filter?: string

    /**
     * Styles
     */

    // Состояние загрузки — показывает индикатор поверх таблицы
    loading?: boolean

    // Убрать фон и тени — оставить только границы и линии строк
    flat?: boolean
    // Показать тонкие границы вокруг ячеек
    bordered?: boolean
    // Компактный режим — уменьшенная высота строк
    dense?: boolean
  }>(),
  {
    rowKey: 'id',
    flat: true,
    bordered: true,
  },
)
</script>

<template>
  <q-table
    v-bind="props"
    :pagination="{ rowsPerPage: 0 }"
  >
    <!-- Прокидываем все слоты родителя в QTable (включая named: body-cell-*, top, bottom, и т.д.) -->
    <template
      v-for="(_, name) in $slots"
      #[name]="slotData"
    >
      <slot
        :name="name"
        v-bind="slotData || {}"
      />
    </template>
  </q-table>
</template>
