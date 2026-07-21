/**
 * Первая буква строки в верхнем регистре, остальные без изменений.
 * Пустая строка возвращается как есть.
 *
 * @example
 *   capitalize('hello')   // → 'Hello'
 *   capitalize('hELLO')   // → 'HELLO'
 *   capitalize('')        // → ''
 *   capitalize('а')       // → 'А' (работает и для кириллицы)
 */
export function capitalize(s: string): string {
  if (s.length === 0) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Обрезает строку до `len` символов, добавляя `suffix` (по умолчанию `…`),
 * если строка длиннее. Если `len <= длины suffix`, вернётся усечённый suffix.
 *
 * @example
 *   truncate('Hello, world!', 8)       // → 'Hello…'
 *   truncate('Hello, world!', 8, '...') // → 'Hell...'
 *   truncate('short', 10)              // → 'short' (не трогает короткие)
 *   truncate('Hello', 1)               // → '…' (len меньше длины suffix)
 */
export function truncate(s: string, len: number, suffix = '…'): string {
  if (s.length <= len) return s
  if (len <= suffix.length) return suffix.slice(0, len)
  return s.slice(0, len - suffix.length) + suffix
}

/**
 * URL-safe slug: только латиница в нижнем регистре, цифры и одиночные дефисы.
 * Все не-alphanumeric последовательности схлопываются в один дефис, ведущие
 * и концевые дефисы убираются. Кириллица и прочее не-alphanumeric → дефис.
 *
 * @example
 *   slugify('Hello, World! 123') // → 'hello-world-123'
 *   slugify('  Some  Title  ')   // → 'some-title'
 *   slugify('HelloWorld')        // → 'helloworld' (без разделителей не разбивает)
 *   slugify('Привет, мир!')      // → '' (вся кириллица схлопывается в дефисы и убирается)
 */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

/**
 * Проверяет, что строка пустая или состоит только из пробельных символов.
 * Принимает `null`/`undefined` — для них тоже возвращает `true`.
 *
 * @example
 *   isEmpty('')          // → true
 *   isEmpty('   ')       // → true
 *   isEmpty(null)        // → true
 *   isEmpty(undefined)   // → true
 *   isEmpty('hello')     // → false
 *   isEmpty('  hi  ')    // → false
 */
export function isEmpty(s: string | null | undefined): boolean {
  return s === null || s === undefined || s.trim().length === 0
}

/**
 * Конвертирует в kebab-case: разделители (пробелы, подчёркивания, переходы
 * регистра) → одиночный дефис, всё в нижнем регистре.
 *
 * @example
 *   kebabCase('HelloWorld')    // → 'hello-world'
 *   kebabCase('hello_world')   // → 'hello-world'
 *   kebabCase('Already-Kebab') // → 'already-kebab'
 *   kebabCase('XMLHttpRequest') // → 'xmlhttp-request'
 *   kebabCase('some  text')    // → 'some-text' (множественные пробелы → один дефис)
 */
export function kebabCase(s: string): string {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}
