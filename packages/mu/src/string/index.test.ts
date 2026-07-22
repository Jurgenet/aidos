import { describe, it, expect } from 'vitest'
import { capitalize, truncate, slugify, isEmpty, kebabCase } from './index.js'

describe('capitalize', () => {
  it('делает первую букву заглавной', () => {
    expect(capitalize('hello')).toBe('Hello')
  })

  it('остальные буквы не меняет (только первая)', () => {
    expect(capitalize('hELLO')).toBe('HELLO')
  })

  it('пустую строку возвращает как есть', () => {
    expect(capitalize('')).toBe('')
  })

  it('работает с кириллицей', () => {
    expect(capitalize('а')).toBe('А')
  })
})

describe('truncate', () => {
  it('не трогает строки короче лимита', () => {
    expect(truncate('short', 10)).toBe('short')
  })

  it('обрезает и добавляет дефолтный суффикс', () => {
    expect(truncate('Hello, world!', 8)).toBe('Hello, …')
  })

  it('использует кастомный суффикс', () => {
    expect(truncate('Hello, world!', 8, '...')).toBe('Hello...')
  })

  it('возвращает усечённый суффикс, если len меньше его длины', () => {
    expect(truncate('Hello', 1)).toBe('…')
  })
})

describe('slugify', () => {
  it('оставляет только латиницу в нижнем регистре, цифры и дефисы', () => {
    expect(slugify('Hello, World! 123')).toBe('hello-world-123')
  })

  it('схлопывает множественные пробелы и обрезает края', () => {
    expect(slugify('  Some  Title  ')).toBe('some-title')
  })

  it('без разделителей не разбивает camelCase', () => {
    expect(slugify('HelloWorld')).toBe('helloworld')
  })

  it('кириллица уходит в дефисы и убирается', () => {
    expect(slugify('Привет, мир!')).toBe('')
  })
})

describe('isEmpty', () => {
  it('true для пустых и whitespace-only строк', () => {
    expect(isEmpty('')).toBe(true)
    expect(isEmpty('   ')).toBe(true)
    expect(isEmpty('\t\n')).toBe(true)
  })

  it('true для null и undefined', () => {
    expect(isEmpty(null)).toBe(true)
    expect(isEmpty(undefined)).toBe(true)
  })

  it('false для непустых строк', () => {
    expect(isEmpty('hello')).toBe(false)
    expect(isEmpty('  hi  ')).toBe(false)
  })
})

describe('kebabCase', () => {
  it('конвертирует camelCase', () => {
    expect(kebabCase('HelloWorld')).toBe('hello-world')
  })

  it('конвертирует snake_case', () => {
    expect(kebabCase('hello_world')).toBe('hello-world')
  })

  it('нормализует регистр', () => {
    expect(kebabCase('Already-Kebab')).toBe('already-kebab')
  })

  it('множественные разделители → один дефис', () => {
    expect(kebabCase('some  text')).toBe('some-text')
  })

  it('переход регистра в строке с акронимами', () => {
    expect(kebabCase('XMLHttpRequest')).toBe('xmlhttp-request')
  })
})
