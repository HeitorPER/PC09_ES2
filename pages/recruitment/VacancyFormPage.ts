import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { messages } from '../../support/testData';

export interface VacancyFormData {
  name?: string;
  jobTitle?: string;
  description?: string;
  /** Nome completo do gerente; `hiringManagerHint` é o trecho digitado no autocomplete. */
  hiringManager?: string;
  hiringManagerHint?: string;
  numOfPositions?: string;
  active?: boolean;
  published?: boolean;
}

/** Formulário compartilhado pelas telas "Add Vacancy" e "Edit Vacancy". */
export class VacancyFormPage extends BasePage {
  static readonly addPath = '/web/index.php/recruitment/addJobVacancy';
  static readonly editUrl = /\/recruitment\/addJobVacancy\/\d+$/;

  readonly addHeading: Locator;
  readonly editHeading: Locator;
  readonly name: Locator;
  readonly description: Locator;
  readonly hiringManager: Locator;
  readonly numOfPositions: Locator;
  readonly activeToggle: Locator;
  readonly publishedToggle: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.addHeading = page.getByRole('heading', { name: 'Add Vacancy' });
    this.editHeading = page.getByRole('heading', { name: 'Edit Vacancy' });
    this.name = this.inputGroup('Vacancy Name').getByRole('textbox');
    this.description = page.getByPlaceholder('Type description here');
    this.hiringManager = this.inputGroup('Hiring Manager').getByRole('textbox');
    this.numOfPositions = this.inputGroup('Number of Positions').getByRole('textbox');
    this.activeToggle = this.switch('Active');
    this.publishedToggle = this.switch('Publish in RSS Feed and Web Page');
    this.saveButton = page.getByRole('button', { name: 'Save', exact: true }).first();
    this.cancelButton = page.getByRole('button', { name: 'Cancel', exact: true }).first();
  }

  /** Checkbox real do switch OXD (oculto; o clique vai no <span> visual). */
  private switch(label: string): Locator {
    return this.page
      .locator('.orangerhrm-switch-wrapper')
      .filter({ has: this.page.getByText(label, { exact: true }) })
      .locator('input[type="checkbox"]');
  }

  private async setSwitch(toggle: Locator, on: boolean): Promise<void> {
    if ((await toggle.isChecked()) !== on) {
      await toggle.locator('xpath=following-sibling::span').click();
    }
  }

  async gotoAdd(): Promise<void> {
    await this.page.goto(VacancyFormPage.addPath);
  }

  /**
   * Executa a ação que abre a edição (clique, reload...) e espera o formulário ficar pronto.
   * Ao carregar, a tela dispara uma validação assíncrona de nome único. Se ela terminar depois
   * de uma interação, sobrescreve o estado de validação (ex.: apaga um "Required").
   */
  async openEdit(action: () => Promise<unknown>): Promise<void> {
    await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/api/v2/core/validation/unique')),
      action(),
    ]);
    await expect(this.name).not.toHaveValue('');
  }

  async fill(data: VacancyFormData): Promise<void> {
    if (data.name !== undefined) await this.name.fill(data.name);
    if (data.jobTitle) await this.selectOption('Job Title', data.jobTitle);
    if (data.description !== undefined) await this.description.fill(data.description);
    if (data.hiringManager) {
      await this.hiringManager.clear();
      await this.chooseAutocomplete('Hiring Manager', data.hiringManagerHint ?? data.hiringManager, data.hiringManager);
    }
    if (data.numOfPositions !== undefined) await this.numOfPositions.fill(data.numOfPositions);
    if (data.active !== undefined) await this.setSwitch(this.activeToggle, data.active);
    if (data.published !== undefined) await this.setSwitch(this.publishedToggle, data.published);
  }

  /** Digita no autocomplete sem escolher nenhuma sugestão e sai do campo. */
  async typeHiringManagerWithoutSelecting(text: string): Promise<void> {
    await this.hiringManager.pressSequentially(text);
    await this.description.click();
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  // Asserções

  async expectAddFormOpen(): Promise<void> {
    await expect(this.addHeading).toBeVisible();
  }

  /** Após salvar uma nova vaga, o sistema redireciona para a edição dela. */
  async expectEditFormOpen(): Promise<void> {
    await expect(this.page).toHaveURL(VacancyFormPage.editUrl);
    await expect(this.editHeading).toBeVisible();
  }

  /** Formulário de adição continua aberto (nada foi salvo). */
  async expectStillOnAddForm(): Promise<void> {
    await expect(this.page).toHaveURL(VacancyFormPage.addPath);
  }

  /** Confere os campos informados com os valores exibidos no formulário. */
  async expectValues(data: VacancyFormData): Promise<void> {
    if (data.name !== undefined) await expect(this.name).toHaveValue(data.name);
    if (data.jobTitle) await this.expectSelectedOption('Job Title', data.jobTitle);
    if (data.description !== undefined) await expect(this.description).toHaveValue(data.description);
    if (data.hiringManager) {
      // O sistema insere o nome do meio (vazio) entre nome e sobrenome, gerando espaço duplo.
      const [first, ...rest] = data.hiringManager.split(' ');
      await expect(this.hiringManager).toHaveValue(new RegExp(`^${first}\\s+${rest.join(' ')}$`));
    }
    if (data.numOfPositions !== undefined) await expect(this.numOfPositions).toHaveValue(data.numOfPositions);
    if (data.active !== undefined) await this.expectChecked(this.activeToggle, data.active);
    if (data.published !== undefined) await this.expectChecked(this.publishedToggle, data.published);
  }

  private async expectChecked(toggle: Locator, on: boolean): Promise<void> {
    if (on) await expect(toggle).toBeChecked();
    else await expect(toggle).not.toBeChecked();
  }

  async expectActive(active: boolean): Promise<void> {
    await this.expectChecked(this.activeToggle, active);
  }

  async expectSaved(): Promise<void> {
    await this.expectToast(messages.saved);
  }

  async expectRequired(...labels: string[]): Promise<void> {
    for (const label of labels) await this.expectFieldError(label, messages.required);
  }
}
