import { test, expect } from '@playwright/test';

test('login exitoso', async ({ page }) => {
  // 1. Ir a la app
  await page.goto('http://localhost:3000');

  // 2. Llenar el formulario de login
  await page.fill('#loginUser', 'admin');
  await page.fill('#loginPass', '101010');

  // 3. Hacer clic en el botón de login
  await page.click('#loginBtn');

  // 4. Verificar que entramos al dashboard
  await expect(page.locator('#sec-dashboard')).toBeVisible();
});