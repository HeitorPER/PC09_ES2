import { test as setup } from '../../support/fixtures';
import { STORAGE_STATE } from '../../playwright.config';
import { credentials } from '../../support/testData';

setup('autenticar como Admin', async ({ page, loginPage, dashboardPage }) => {
  await loginPage.goto();
  await loginPage.login(credentials.valid.username, credentials.valid.password);
  await dashboardPage.expectLoaded();
  await page.context().storageState({ path: STORAGE_STATE });
});
