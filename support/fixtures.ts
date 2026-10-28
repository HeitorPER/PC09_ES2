import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { VacancyListPage } from '../pages/recruitment/VacancyListPage';
import { VacancyFormPage } from '../pages/recruitment/VacancyFormPage';
import { OrangeHrmApi, type Employee, type JobTitle, type NewVacancy, type Vacancy } from './OrangeHrmApi';
import { uniqueVacancyName } from './testData';

type Fixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  vacancyListPage: VacancyListPage;
  vacancyFormPage: VacancyFormPage;
  api: OrangeHrmApi;
  jobTitle: JobTitle;
  /** Funcionário exclusivo do teste, usado como Hiring Manager. */
  hiringManager: Employee;
  /** Cria uma vaga via API. A limpeza é automática (ver `hiringManager`). */
  createVacancy: (overrides?: Partial<NewVacancy>) => Promise<Vacancy>;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
  vacancyListPage: async ({ page }, use) => use(new VacancyListPage(page)),
  vacancyFormPage: async ({ page }, use) => use(new VacancyFormPage(page)),

  // page.request compartilha os cookies da sessão autenticada do contexto.
  api: async ({ page }, use) => use(new OrangeHrmApi(page.request)),

  jobTitle: async ({ api }, use) => use(await api.getJobTitle()),

  hiringManager: async ({ api }, use) => {
    const employee = await api.createEmployee();
    await use(employee);
    // Teardown: remove todas as vagas do gerente (criadas via API ou pela UI) e depois o funcionário.
    await api.deleteVacancies(await api.findVacancyIdsByHiringManager(employee.empNumber));
    await api.deleteEmployee(employee.empNumber);
  },

  createVacancy: async ({ api, jobTitle, hiringManager }, use) => {
    await use((overrides = {}) =>
      api.createVacancy({ name: uniqueVacancyName(), jobTitle, hiringManager, ...overrides }),
    );
  },
});

export { expect };
