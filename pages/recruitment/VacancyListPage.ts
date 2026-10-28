import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { messages } from '../../support/testData';

export interface VacancyRow {
  jobTitle?: string;
  hiringManager?: string;
  status?: 'Active' | 'Closed';
}

export interface VacancyFilters {
  jobTitle?: string;
  vacancy?: string;
  hiringManager?: string;
  status?: 'Active' | 'Closed';
}

/** Ordem das colunas da tabela (a 1ª é o checkbox). */
const COLUMNS = { Vacancy: 2, 'Job Title': 3, 'Hiring Manager': 4, Status: 5 } as const;
export type VacancyColumn = keyof typeof COLUMNS;

export class VacancyListPage extends BasePage {
  static readonly path = '/web/index.php/recruitment/viewJobVacancy';

  readonly heading: Locator;
  readonly addButton: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;
  readonly deleteSelectedButton: Locator;
  readonly recordsInfo: Locator;
  readonly rows: Locator;
  readonly confirmDialog: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Vacancies' });
    this.addButton = page.getByRole('button', { name: 'Add' });
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.resetButton = page.getByRole('button', { name: 'Reset' });
    this.deleteSelectedButton = page.getByRole('button', { name: 'Delete Selected' });
    this.recordsInfo = page.locator('.orangehrm-horizontal-padding > .oxd-text--span');
    this.rows = page.locator('.oxd-table-body .oxd-table-card');
    this.confirmDialog = page.locator('.orangehrm-dialog-popup');
  }

  /** Espera a resposta da API que alimenta a tabela, evitando asserções sobre dados antigos. */
  private waitForList() {
    return this.page.waitForResponse(
      (r) => /\/api\/v2\/recruitment\/vacancies\?/.test(r.url()) && r.request().method() === 'GET',
    );
  }

  async goto(): Promise<void> {
    await Promise.all([this.waitForList(), this.page.goto(VacancyListPage.path)]);
  }

  async clickAdd(): Promise<void> {
    await this.addButton.click();
  }

  async search(filters: VacancyFilters): Promise<void> {
    if (filters.jobTitle) await this.selectOption('Job Title', filters.jobTitle);
    if (filters.vacancy) await this.selectOption('Vacancy', filters.vacancy);
    if (filters.hiringManager) await this.selectOption('Hiring Manager', filters.hiringManager);
    if (filters.status) await this.selectOption('Status', filters.status);
    await Promise.all([this.waitForList(), this.searchButton.click()]);
  }

  async reset(): Promise<void> {
    await Promise.all([this.waitForList(), this.resetButton.click()]);
  }

  row(vacancyName: string): Locator {
    return this.rows.filter({ has: this.page.getByRole('cell', { name: vacancyName, exact: true }) });
  }

  rowCell(vacancyName: string, column: VacancyColumn): Locator {
    return this.row(vacancyName).locator(`[role="cell"]:nth-child(${COLUMNS[column]})`);
  }

  columnCells(column: VacancyColumn): Locator {
    return this.rows.locator(`[role="cell"]:nth-child(${COLUMNS[column]})`);
  }

  async openEdit(vacancyName: string): Promise<void> {
    await this.row(vacancyName).locator('.bi-pencil-fill').click();
  }

  async clickDelete(vacancyName: string): Promise<void> {
    await this.row(vacancyName).locator('.bi-trash').click();
  }

  async selectRow(vacancyName: string): Promise<void> {
    await this.row(vacancyName).locator('.oxd-checkbox-input').click();
  }

  async deleteSelected(): Promise<void> {
    await this.deleteSelectedButton.click();
  }

  async confirmDeletion(): Promise<void> {
    await Promise.all([this.waitForList(), this.confirmDialog.getByRole('button', { name: 'Yes, Delete' }).click()]);
  }

  async cancelDeletion(): Promise<void> {
    await this.confirmDialog.getByRole('button', { name: 'No, Cancel' }).click();
  }

  async deleteVacancy(vacancyName: string): Promise<void> {
    await this.clickDelete(vacancyName);
    await this.confirmDeletion();
  }

  // Asserções

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(VacancyListPage.path);
    await expect(this.heading).toBeVisible();
  }

  /** A vaga está listada e as colunas informadas têm os valores esperados. */
  async expectVacancyListed(vacancyName: string, columns: VacancyRow = {}): Promise<void> {
    await expect(this.row(vacancyName)).toHaveCount(1);
    if (columns.jobTitle) await expect(this.rowCell(vacancyName, 'Job Title')).toHaveText(columns.jobTitle);
    if (columns.hiringManager) await expect(this.rowCell(vacancyName, 'Hiring Manager')).toHaveText(columns.hiringManager);
    if (columns.status) await expect(this.rowCell(vacancyName, 'Status')).toHaveText(columns.status);
  }

  async expectVacancyNotListed(vacancyName: string): Promise<void> {
    await expect(this.row(vacancyName)).toHaveCount(0);
  }

  async expectRecordCount(count: number): Promise<void> {
    await expect(this.rows).toHaveCount(count);
    await expect(this.recordsInfo).toHaveText(
      count === 0 ? messages.noRecords : `(${count}) Record${count > 1 ? 's' : ''} Found`,
    );
  }

  /** Há ao menos um resultado e todos têm o valor esperado na coluna. */
  async expectAllRowsHave(column: VacancyColumn, value: string): Promise<void> {
    const cells = this.columnCells(column);
    await expect(cells.first()).toBeVisible();
    for (const cell of await cells.all()) await expect(cell).toHaveText(value);
  }

  async expectFiltersCleared(): Promise<void> {
    for (const filter of ['Job Title', 'Vacancy', 'Hiring Manager', 'Status']) {
      await this.expectSelectedOption(filter, '-- Select --');
    }
  }

  async expectMoreThanOneRecord(): Promise<void> {
    await expect.poll(() => this.rows.count()).toBeGreaterThan(1);
  }

  async expectDeleteConfirmation(): Promise<void> {
    await expect(this.confirmDialog).toContainText('Are you Sure?');
  }

  async expectDeleteConfirmationClosed(): Promise<void> {
    await expect(this.confirmDialog).toBeHidden();
  }

  async expectDeleted(): Promise<void> {
    await this.expectToast(messages.deleted);
  }
}
