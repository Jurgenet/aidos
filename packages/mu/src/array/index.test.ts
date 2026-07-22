import { describe, it, expect } from 'vitest'
import { chunk, uniq, uniqBy, groupBy, partition, compact } from './index.js'

describe('chunk', () => {
  it('делит массив на части фиксированного размера', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(chunk(['a', 'b', 'c'], 1)).toEqual([['a'], ['b'], ['c']])
  })

  it('возвращает пустой массив для пустого входа', () => {
    expect(chunk([], 3)).toEqual([])
  })

  it('бросает ошибку для size <= 0', () => {
    expect(() => chunk([1, 2], 0)).toThrow('chunk size must be > 0')
    expect(() => chunk([1, 2], -1)).toThrow('chunk size must be > 0')
  })
})

describe('uniq', () => {
  it('убирает дубликаты, сохраняя порядок', () => {
    expect(uniq([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3])
    expect(uniq(['a', 'b', 'a'])).toEqual(['a', 'b'])
  })

  it('возвращает пустой массив для пустого входа', () => {
    expect(uniq([])).toEqual([])
  })
})

describe('uniqBy', () => {
  it('убирает дубликаты по вычисляемому ключу', () => {
    expect(uniqBy([{ id: 1 }, { id: 2 }, { id: 1 }], (x) => x.id)).toEqual([{ id: 1 }, { id: 2 }])
    expect(uniqBy(['a.txt', 'b.md', 'c.txt'], (s) => s.split('.').pop() as string)).toEqual(['a.txt', 'b.md'])
  })
})

describe('groupBy', () => {
  it('группирует элементы по ключу', () => {
    expect(groupBy([1, 2, 3, 4], (n) => (n % 2 === 0 ? 'even' : 'odd'))).toEqual({
      odd: [1, 3],
      even: [2, 4],
    })
  })

  it('возвращает пустой объект для пустого входа', () => {
    expect(groupBy([] as number[], () => 'k')).toEqual({})
  })
})

describe('partition', () => {
  it('делит массив на прошедшие и непрошедшие предикат', () => {
    expect(partition([1, 2, 3, 4], (n) => n % 2 === 0)).toEqual([
      [2, 4],
      [1, 3],
    ])
  })

  it('один из массивов может быть пустым', () => {
    expect(partition([1, 3, 5], (n) => n % 2 === 0)).toEqual([[], [1, 3, 5]])
    expect(partition([2, 4], (n) => n % 2 === 0)).toEqual([[2, 4], []])
  })
})

describe('compact', () => {
  it('убирает все falsy-значения', () => {
    expect(compact([0, 1, '', 'a', null, undefined, NaN, false, 'b'])).toEqual([1, 'a', 'b'])
  })

  it('сохраняет типизацию — не falsy-элементы того же типа', () => {
    const result = compact<string | number>(['x', null, 1, undefined, 'y'])
    expect(result).toEqual(['x', 1, 'y'])
  })
})
