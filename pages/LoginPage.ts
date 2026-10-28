import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { messages } from '../support/testData';

export class LoginPage extends BasePage {
  static readonly path = '/web/index.php/auth/login';

  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly alert: Locator;

  constructor(page: Page) {
    super(page);
    this.username = page.getByPlaceholder('Username');
    this.password = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.alert = page.locator('.oxd-alert-content-text');
  }

  async goto(): Promise<void> {
    await this.page.goto(LoginPage.path);
  }

  async fillCredentials(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
  }

  async login(username: string, password: string): Promise<void> {
    await this.fillCredentials(username, password);
    await this.loginButton.click();
  }

  async loginWithEnter(username: string, password: string): Promise<void> {
    await this.fillCredentials(username, password);
    await this.password.press('Enter');
  }

  /** Usuário continua (ou voltou) na tela de login. */
  async expectOnLoginPage(): Promise<void> {
    await expect(this.page).toHaveURL(LoginPage.path);
    await expect(this.loginButton).toBeVisible();
  }

  async expectInvalidCredentials(): Promise<void> {
    await expect(this.alert).toHaveText(messages.invalidCredentials);
    await this.expectOnLoginPage();
  }

  /** "Required" aparece somente abaixo dos campos indicados e nenhum alerta de credencial é exibido. */
  async expectRequiredErrors(fields: { username: boolean; password: boolean }): Promise<void> {
    await expect(this.fieldError('Username')).toHaveText(fields.username ? [messages.required] : []);
    await expect(this.fieldError('Password')).toHaveText(fields.password ? [messages.required] : []);
    await expect(this.alert).toBeHidden();
    await this.expectOnLoginPage();
  }

  async expectPasswordMasked(): Promise<void> {
    await expect(this.password).toHaveAttribute('type', 'password');
  }
}
