import { expect, type Locator, type Page } from '@playwright/test';

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Base dos Page Objects. Concentra o acesso aos componentes da biblioteca OXD do OrangeHRM,
 * cujos rótulos não são associados aos inputs (<label for>) e por isso não funcionam com getByLabel.
 */
export abstract class BasePage {
  readonly toast: Locator;

  constructor(protected readonly page: Page) {
    this.toast = page.locator('.oxd-toast');
  }

  /** Grupo (rótulo + campo + mensagem de validação) identificado pelo texto exato do rótulo. */
  protected inputGroup(label: string): Locator {
    return this.page
      .locator('.oxd-input-group')
      .filter({ has: this.page.locator('label', { hasText: new RegExp(`^${escapeRegExp(label)}$`) }) });
  }

  /** Toast com a mensagem informada (a tela pode exibir mais de um toast ao mesmo tempo). */
  toastWith(message: string): Locator {
    return this.toast.filter({ hasText: message });
  }

  /** Mensagem de validação exibida abaixo do campo com o rótulo informado. */
  fieldError(label: string): Locator {
    return this.inputGroup(label).locator('.oxd-input-field-error-message');
  }

  /** Texto exibido atualmente em um select OXD. */
  selectedOption(label: string): Locator {
    return this.inputGroup(label).locator('.oxd-select-text-input');
  }

  // Asserções comuns

  async expectToast(message: string): Promise<void> {
    await expect(this.toastWith(message)).toBeVisible();
  }

  async expectNoToast(message: string): Promise<void> {
    await expect(this.toastWith(message)).toBeHidden();
  }

  async expectFieldError(label: string, message: string): Promise<void> {
    await expect(this.fieldError(label)).toHaveText(message);
  }

  async expectNoFieldError(label: string): Promise<void> {
    await expect(this.fieldError(label)).toBeHidden();
  }

  async expectSelectedOption(label: string, option: string): Promise<void> {
    await expect(this.selectedOption(label)).toHaveText(option);
  }

  protected async selectOption(label: string, option: string): Promise<void> {
    await this.inputGroup(label).locator('.oxd-select-text').click();
    await this.page.getByRole('option', { name: option, exact: true }).click();
  }

  /** Digita um trecho no autocomplete e escolhe a sugestão correspondente. */
  protected async chooseAutocomplete(label: string, hint: string, option: string): Promise<void> {
    await this.inputGroup(label).getByRole('textbox').pressSequentially(hint);
    await this.page.getByRole('option', { name: option }).click();
  }
}
