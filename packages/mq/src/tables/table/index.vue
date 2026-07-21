<script setup lang="ts" generic="T extends object">
import { QTable, type QTableColumn } from 'quasar'

defineOptions({ name: 'UiTable' })

/**
 * Таблица. Обёртка над Quasar QTable с дефолтами mq: `flat`, `bordered`.
 * Дженерик `T` — тип строки, прокидывается в `columns` для типизации `field`.
 */
withDefaults(
  defineProps<{
    /** Массив строк данных. */
    rows: T[]
    /** Описание колонок — Quasar QTableColumn<T>[]. */
    columns: QTableColumn<T>[]
    /** Имя поля, однозначно идентифицирующего строку. Используется для трекинга выбора и обновлений. */
    rowKey?: string
    /** Состояние загрузки — показывает индикатор поверх таблицы. */
    loading?: boolean
    /** Строка фильтрации. Применяется ко всем колонкам автоматически. */
    filter?: string
    /** Убрать фон и тени — оставить только границы и линии строк. */
    flat?: boolean
    /** Показать тонкие границы вокруг ячеек. */
    bordered?: boolean
    /** Компактный режим — уменьшенная высота строк. */
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
  <QTable
    :rows="rows"
    :columns="columns"
    :row-key="rowKey"
    :loading="loading"
    :filter="filter"
    :flat="flat"
    :bordered="bordered"
    :dense="dense"
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
  </QTable>
</template>
