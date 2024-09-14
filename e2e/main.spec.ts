import { test, expect, type Page } from '@playwright/test';
import { DecodingTests } from '../fixtures/decoding-tests';
import { decrypt } from 'src/app/salted';

import { isUrlSafeBase64 } from 'url-safe-base64';

async function encodePage_encode(page: Page, message: string, password: string): Promise<string> {
  const passwordInput = page.locator('input[formcontrolname="password"]');
  const confirmPassInput = page.locator('input[formcontrolname="confirmPassPhase"]');
  const textInput = page.locator('textarea[formcontrolname="message"]');
  const resultsContainer = page.locator('.result-container__code');

  await page.getByRole('tab', { name: 'Encryption pass phase' }).click();

  await passwordInput.clear();
  await passwordInput.fill(password);
  await confirmPassInput.clear();
  await confirmPassInput.fill(password);

  await page.getByRole('tab', { name: 'Text to encrypt' }).click();

  await textInput.clear();
  await expect(resultsContainer).not.toBeVisible();

  await textInput.fill(message);
  await page.waitForTimeout(300);

  await expect(page.locator('qrcode div')).toBeVisible();
  await expect(resultsContainer).toBeVisible();

  return (await resultsContainer.textContent()) || '';
}

async function decodePage_enterPassphase(page: Page, password: string) {
  const passwordInput = page.locator('input[formcontrolname="passPhase"]');
  await page.getByRole('tab', { name: 'Encryption pass phase' }).click();
  await passwordInput.clear();
  await passwordInput.fill(password);
  await page.getByRole('button', { name: 'OK' }).click();
}

async function decodePage_getResult(page: Page) {
  const resultsContainer = page.locator('.result__decoded');
  return (await resultsContainer.textContent()) || '';
}

async function decodePage_decode(page: Page, cipher: string, password: string): Promise<string> {
  const encodedInput = page.locator('textarea[formcontrolname="encoded"]');
  const resultsContainer = page.locator('.result__decoded');

  await decodePage_enterPassphase(page, password);

  await encodedInput.clear();
  await expect(resultsContainer).not.toBeVisible();

  await encodedInput.fill(cipher);
  await expect(resultsContainer).toBeVisible();

  return await decodePage_getResult(page);
}

test.describe('Main', () => {
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

    for (const [password, text] of DecodingTests) {
      if (text === 'Hello World!') {
        continue;
      }
      const encoded = await encodePage_encode(page, text, password);
      const decoded = await decrypt(encoded!, password);
      expect(decoded).toEqual(text);
    }
  });

  test('can decode', async ({ page }) => {
    await page.goto('/#/decode');
    await expect(page.locator('.mat-toolbar > span').first()).toContainText('DICE');

    for (const [password, expected, cipher] of DecodingTests) {
      const decoded = await decodePage_decode(page, cipher, password);
      expect(decoded).toEqual(expected);
    }
  });

  test('roundtrip', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/');

    for (const [password, text] of DecodingTests) {
      if (password === 'p4$$w0rd') {
        continue;
      }
      await page.getByRole('link', { name: 'Encode' }).click();
      const encoded = await encodePage_encode(page, text, password);
      await page.getByRole('link', { name: 'Decode' }).click();
      const decoded = await decodePage_decode(page, encoded, password);
      expect(decoded).toEqual(text);
    }
  });

  test('url encoded', async ({ page }) => {
    for (const [password, text, cipher] of DecodingTests) {
      if (!isUrlSafeBase64(cipher)) {
        continue;
      }

      await page.goto(`/#/decode/${cipher}`);
      await decodePage_enterPassphase(page, password);

      const decoded = await decodePage_getResult(page);
      expect(decoded).toEqual(text);
    }
  });
});
