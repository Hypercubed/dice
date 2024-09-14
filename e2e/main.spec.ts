import { test, expect } from '@playwright/test';
import { DecodingTests } from '../fixtures/decoding-tests';
import { decrypt } from 'src/app/salted';

test('has page header', async ({ page }) => {
  await page.goto('/');

  // Expect h1 to contain a substring.
  await expect(page.locator('.mat-toolbar > span').first()).toContainText('DICE');
  await expect(page.getByRole('link', { name: 'Encode' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Decode' })).toBeVisible();
});

test('can encode', async ({ page }) => {
  test.setTimeout(120000);

  await page.goto('/#/encode');
  await expect(page.locator('.mat-toolbar > span').first()).toContainText('DICE');

  const passwordInput = page.locator('input[formcontrolname="password"]');
  const confirmPassInput = page.locator('input[formcontrolname="confirmPassPhase"]');
  const textInput = page.locator('textarea[formcontrolname="message"]');
  const resultsContainer = page.locator('.result-container__code');

  for (const [password, text, cipher] of DecodingTests) {
    await page.getByRole('tab', { name: 'Encryption pass phase' }).click();

    await passwordInput.clear();
    await passwordInput.fill(password);
    await confirmPassInput.clear();
    await confirmPassInput.fill(password);

    await page.getByRole('tab', { name: 'Text to encrypt' }).click();

    await textInput.clear();
    await expect(resultsContainer).not.toBeVisible();

    await textInput.fill(text);
    await page.waitForTimeout(300);

    await expect(page.locator('qrcode div')).toBeVisible();
    await expect(resultsContainer).toBeVisible();

    const encoded = await resultsContainer.textContent();
    const decoded = await decrypt(encoded!, password);
    expect(decoded).toEqual(text);
  }
});

test('can decode', async ({ page }) => {
  await page.goto('/#/decode');
  await expect(page.locator('.mat-toolbar > span').first()).toContainText('DICE');

  const passwordInput = page.locator('input[formcontrolname="passPhase"]');
  const encodedInput = page.locator('textarea[formcontrolname="encoded"]');

  for (const [password, expected, cipher] of DecodingTests) {
    await page.getByRole('tab', { name: 'Encryption pass phase' }).click();

    await passwordInput.clear();
    await passwordInput.fill(password);
    await page.getByRole('button', { name: 'OK' }).click();

    await encodedInput.clear();
    await encodedInput.fill(cipher);

    await expect(page.getByText(expected)).toBeVisible();
  }
});
