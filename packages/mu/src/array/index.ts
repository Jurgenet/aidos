type Falsy = false | 0 | '' | null | undefined

/**
 * Делит массив на части фиксированного размера. Последняя часть может быть короче.
 *
 * @example
 *   chunk([1, 2, 3, 4, 5], 2) // → [[1, 2], [3, 4], [5]]
 *   chunk(['a', 'b', 'c'], 1) // → [['a'], ['b'], ['c']]
 */
export function chunk<T>(arr: readonly T[], size: number): T[][] {
  if (size <= 0) {
    throw new Error('chunk size must be > 0')
  }
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

/**
 * Возвращает массив уникальных значений. Сравнение — SameValueZero (как `Set`).
 *
 * @example
 *   uniq([1, 2, 2, 3, 3, 3]) // → [1, 2, 3]
 *   uniq(['a', 'b', 'a'])    // → ['a', 'b']
 */
export function uniq<T>(arr: readonly T[]): T[] {
  return Array.from(new Set(arr))
}

/**
 * Возвращает массив уникальных значений по ключу, который вычисляет `keyFn`.
 * Сохраняет порядок первого вхождения.
 *
 * @example
 *   uniqBy([{ id: 1 }, { id: 2 }, { id: 1 }], x => x.id)
 *   // → [{ id: 1 }, { id: 2 }]
 *   uniqBy(['a.txt', 'b.md', 'c.txt'], s => s.split('.').pop() as string)
 *   // → ['a.txt', 'b.md']
 */
export function uniqBy<T, K>(arr: readonly T[], keyFn: (item: T) => K): T[] {
  const seen = new Set<K>()
  const result: T[] = []
  for (const item of arr) {
    const key = keyFn(item)
    if (!seen.has(key)) {
      seen.add(key)
      result.push(item)
    }
  }
  return result
}

/**
 * Группирует элементы по ключу. Возвращает объект-словарь.
 *
 * @example
 *   groupBy([1, 2, 3, 4], n => (n % 2 === 0 ? 'even' : 'odd'))
 *   // → { odd: [1, 3], even: [2, 4] }
 *   groupBy(
 *     [{ type: 'a', v: 1 }, { type: 'b', v: 2 }, { type: 'a', v: 3 }],
 *     x => x.type,
 *   )
 *   // → { a: [{ type: 'a', v: 1 }, { type: 'a', v: 3 }], b: [{ type: 'b', v: 2 }] }
 */
export function groupBy<T, K extends string | number | symbol>(
  arr: readonly T[],
  keyFn: (item: T) => K,
): Record<K, T[]> {
  const result = {} as Record<K, T[]>
  for (const item of arr) {
    const key = keyFn(item)
    const bucket = result[key] ?? (result[key] = [])
    bucket.push(item)
  }
  return result
}

/**
 * Делит массив на два по предикату: первый — прошедшие, второй — нет.
 *
 * @example
 *   partition([1, 2, 3, 4], n => n % 2 === 0)
 *   // → [[2, 4], [1, 3]]
 *   partition(['apple', 'banana', 'avocado'], s => s.startsWith('a'))
 *   // → [['apple', 'avocado'], ['banana']]
 */
export function partition<T>(arr: readonly T[], predicate: (item: T) => boolean): [T[], T[]] {
  const pass: T[] = []
  const fail: T[] = []
  for (const item of arr) {
    if (predicate(item)) pass.push(item)
    else fail.push(item)
  }
  return [pass, fail]
}

/**
 * Удаляет из массива все falsy-значения (`false`, `0`, `''`, `null`, `undefined`, `NaN`).
 *
 * @example
 *   compact([0, 1, '', 'a', null, undefined, NaN, false, 'b'])
 *   // → [1, 'a', 'b']
 *   compact<string | number>(['x', null, 1, undefined, 'y'])
 *   // → ['x', 1, 'y']
 */
export function compact<T>(arr: readonly (T | Falsy)[]): T[] {
  return arr.filter((item): item is T => Boolean(item))
}
