import { test, expect } from '@playwright/test'

test.describe('Login', () => {
  test('shows login form and Olive branding', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /welcome back|join the kitchen/i })).toBeVisible()
    await expect(page.getByPlaceholder(/you@example|email/i)).toBeVisible()
    await expect(page.getByPlaceholder(/••••/)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in|create account/i })).toBeVisible()
  })

  test('Continue with Kroger link adds then=connect', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('link', { name: /continue with kroger/i })).toBeVisible()
    await page.getByRole('link', { name: /continue with kroger/i }).click()
    await expect(page).toHaveURL(/then=connect/)
  })

  test('?then=connect shows connect-first message', async ({ page }) => {
    await page.goto('/login?then=connect')
    await expect(page.getByText(/sign in, then we.*connect kroger/i)).toBeVisible()
  })

  test('toggle sign in / create account', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    await page.getByRole('button', { name: /new here.*create an account/i }).click()
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible()
  })

  test('submit with invalid creds shows error or stays on login', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder(/you@example|email/i).fill('test@example.com')
    await page.getByPlaceholder(/••••/).fill('wrongpassword123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
  })
})
