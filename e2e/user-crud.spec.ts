import { test, expect, type Page } from '@playwright/test'

/**
 * E2E сценарий CRUD для сущности User.
 *
 * Сценарий: открыть страницу пользователей → создать → проверить в списке →
 * отредактировать → проверить обновление → удалить → проверить исчезновение.
 *
 * Использует уникальный email с timestamp, чтобы не конфликтовать с
 * данными от предыдущих прогонов и с другими параллельными тестами.
 */

const UNIQUE = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const USER_EMAIL = `${UNIQUE}@test.com`
const USER_NAME = 'E2E Test User'

async function openUserPage(page: Page) {
  await page.goto('/user')
  await expect(page.getByRole('heading', { name: 'Пользователи' })).toBeVisible()
}

async function fillUserForm(page: Page, email: string, name: string, role: string) {
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Имя').fill(name)
  await page.getByLabel('Роль').selectOption(role)
}

test('CRUD: создание, чтение, обновление, удаление пользователя', async ({ page }) => {
  // Окно confirm для удаления принимаем автоматически.
  page.on('dialog', (dialog) => dialog.accept())

  // --- CREATE ---------------------------------------------------------
  await openUserPage(page)
  await page.getByRole('button', { name: 'Добавить пользователя' }).click()
  await expect(page.getByRole('heading', { name: 'Новый пользователь' })).toBeVisible()

  await fillUserForm(page, USER_EMAIL, USER_NAME, 'admin')
  await page.getByRole('button', { name: 'Сохранить' }).click()

  // Форма закрылась → пользователь появился в таблице.
  await expect(page.getByRole('heading', { name: 'Новый пользователь' })).not.toBeVisible()

  // Скоупимся к строке с нашим уникальным email — в БД могут быть другие
  // пользователи от предыдущих прогонов с тем же именем, но email уникальный.
  const userRow = page.locator('tr').filter({ hasText: USER_EMAIL })
  await expect(userRow).toBeVisible()
  await expect(userRow).toContainText(USER_NAME)
  await expect(userRow).toContainText('Админ')

  // --- UPDATE ---------------------------------------------------------
  await userRow.getByRole('button', { name: 'Изменить' }).click()
  await expect(page.getByRole('heading', { name: 'Редактировать' })).toBeVisible()

  const updatedName = `${USER_NAME} (updated)`
  await fillUserForm(page, USER_EMAIL, updatedName, 'manager')
  await page.getByRole('button', { name: 'Сохранить' }).click()

  await expect(page.getByRole('heading', { name: 'Редактировать' })).not.toBeVisible()
  const updatedRow = page.locator('tr').filter({ hasText: USER_EMAIL })
  await expect(updatedRow).toContainText(updatedName)
  await expect(updatedRow).toContainText('Менеджер')

  // --- DELETE ---------------------------------------------------------
  await updatedRow.getByRole('button', { name: 'Удалить' }).click()

  // Строка исчезла.
  await expect(page.locator('tr').filter({ hasText: USER_EMAIL })).toHaveCount(0)
})
