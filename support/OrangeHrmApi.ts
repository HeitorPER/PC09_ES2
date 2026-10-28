import type { APIRequestContext, APIResponse } from '@playwright/test';
import { DEFAULT_JOB_TITLE, uniqueSuffix } from './testData';

const API = '/web/index.php/api/v2';

export interface Employee {
  empNumber: number;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface JobTitle {
  id: number;
  title: string;
}

export interface Vacancy {
  id: number;
  name: string;
  jobTitle: string;
  hiringManager: string;
  status: boolean;
}

export interface NewVacancy {
  name: string;
  jobTitle: JobTitle;
  hiringManager: Employee;
  status?: boolean;
  numOfPositions?: number;
  description?: string;
}

/**
 * Cliente da API REST do OrangeHRM. Usado só para preparar e limpar massa de dados:
 * as ações sob teste sempre passam pela UI.
 */
export class OrangeHrmApi {
  constructor(private readonly request: APIRequestContext) {}

  private async json<T>(response: APIResponse): Promise<T> {
    if (!response.ok()) {
      throw new Error(`${response.url()} → ${response.status()}: ${await response.text()}`);
    }
    return (await response.json()).data as T;
  }

  async createEmployee(): Promise<Employee> {
    const suffix = uniqueSuffix();
    const firstName = 'Gerente';
    const lastName = `QA${suffix}`;
    const data = await this.json<{ empNumber: number }>(
      await this.request.post(`${API}/pim/employees`, { data: { firstName, middleName: '', lastName } }),
    );
    return { empNumber: data.empNumber, firstName, lastName, fullName: `${firstName} ${lastName}` };
  }

  async deleteEmployee(empNumber: number): Promise<void> {
    await this.request.delete(`${API}/pim/employees`, { data: { ids: [empNumber] } });
  }

  async getJobTitle(title = DEFAULT_JOB_TITLE): Promise<JobTitle> {
    const titles = await this.json<JobTitle[]>(await this.request.get(`${API}/admin/job-titles?limit=0`));
    const found = titles.find((t) => t.title === title);
    if (!found) throw new Error(`Job title "${title}" não existe no demo`);
    return { id: found.id, title: found.title };
  }

  async createVacancy(v: NewVacancy): Promise<Vacancy> {
    const data = await this.json<{ id: number }>(
      await this.request.post(`${API}/recruitment/vacancies`, {
        data: {
          name: v.name,
          jobTitleId: v.jobTitle.id,
          employeeId: v.hiringManager.empNumber,
          numOfPositions: v.numOfPositions ?? 1,
          description: v.description ?? '',
          status: v.status ?? true,
          isPublished: false,
        },
      }),
    );
    return {
      id: data.id,
      name: v.name,
      jobTitle: v.jobTitle.title,
      hiringManager: v.hiringManager.fullName,
      status: v.status ?? true,
    };
  }

  async findVacancyIdsByHiringManager(empNumber: number): Promise<number[]> {
    const list = await this.json<{ id: number }[]>(
      await this.request.get(`${API}/recruitment/vacancies?limit=0&hiringManagerId=${empNumber}`),
    );
    return list.map((v) => v.id);
  }

  async vacancyExists(name: string): Promise<boolean> {
    const list = await this.json<{ name: string }[]>(await this.request.get(`${API}/recruitment/vacancies?limit=0`));
    return list.some((v) => v.name === name);
  }

  async deleteVacancies(ids: number[]): Promise<void> {
    if (ids.length) await this.request.delete(`${API}/recruitment/vacancies`, { data: { ids } });
  }
}
