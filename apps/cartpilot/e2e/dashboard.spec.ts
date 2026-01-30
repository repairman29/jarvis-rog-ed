import { test, expect } from '@playwright/test'

test.describe('Dashboard (unauthenticated)', () => {
  test('redirects to login when not signed in', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Dashboard (authenticated)', () => {
  test.skip(
    !process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD,
    'Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run authenticated tests'
  )

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder(/you@example|email/i).fill(process.env.TEST_USER_EMAIL!)
    await page.getByPlaceholder(/••••/).fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test('shows Olive and main UI', async ({ page }) => {
    await expect(page.getByText(/what's missing from the kitchen/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
  })

  test('Budget vs Splurge toggle exists and is clickable', async ({ page }) => {
    await expect(page.getByText(/how should olive pick items/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /your preferences/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /best deals/i })).toBeVisible()
    await page.getByRole('button', { name: /best deals/i }).click()
    await expect(page.getByText(/lowest price from search/i)).toBeVisible()
  })

  test('add item to list and remove', async ({ page }) => {
    await page.getByPlaceholder(/milk, eggs, bread/i).fill('Milk')
    await page.getByRole('button', { name: /^add$/i }).click()
    await expect(page.getByText(/got it.*milk/i)).toBeVisible()
    await expect(page.getByText('Milk').first()).toBeVisible()
    await page.getByRole('button', { name: /remove/i }).click()
    await expect(page.getByText('Milk')).not.toBeVisible()
  })

  test('quick add buttons add to list', async ({ page }) => {
    await page.getByRole('button', { name: /^milk$/i }).first().click()
    await expect(page.getByText(/added milk/i)).toBeVisible()
    await expect(page.getByText('Milk').first()).toBeVisible()
  })
})
