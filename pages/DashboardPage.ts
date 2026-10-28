import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  static readonly path = '/web/index.php/dashboard/index';

  readonly heading: Locator;
  readonly userMenu: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Dashboard' });
    this.userMenu = page.locator('.oxd-userdropdown-tab');
  }

  async goto(): Promise<void> {
    await this.page.goto(DashboardPage.path);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(DashboardPage.path);
    await expect(this.heading).toBeVisible();
    await expect(this.userMenu).toBeVisible();
  }

  async logout(): Promise<void> {
    await this.userMenu.click();
    await this.page.getByRole('menuitem', { name: 'Logout' }).click();
  }
}
