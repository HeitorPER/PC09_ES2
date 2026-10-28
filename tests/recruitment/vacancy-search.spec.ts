import { test } from '../../support/fixtures';

test.describe('Recruitment › Vacancies › Pesquisa', () => {
  test('CT-21 pesquisa por Vacancy retorna somente a vaga', async ({ vacancyListPage, createVacancy }) => {
    const vacancy = await createVacancy();

    await vacancyListPage.goto();
    await vacancyListPage.search({ vacancy: vacancy.name });

    await vacancyListPage.expectRecordCount(1);
    await vacancyListPage.expectVacancyListed(vacancy.name, {
      jobTitle: vacancy.jobTitle,
      hiringManager: vacancy.hiringManager,
      status: 'Active',
    });
  });

  test('CT-22 pesquisa por Job Title retorna apenas vagas do cargo', async ({ vacancyListPage, createVacancy }) => {
    const vacancy = await createVacancy();

    await vacancyListPage.goto();
    await vacancyListPage.search({ jobTitle: vacancy.jobTitle });

    await vacancyListPage.expectAllRowsHave('Job Title', vacancy.jobTitle);
  });

  test('CT-23 pesquisa por Status Closed retorna apenas vagas fechadas', async ({ vacancyListPage, createVacancy }) => {
    await createVacancy({ status: false });

    await vacancyListPage.goto();
    await vacancyListPage.search({ status: 'Closed' });

    await vacancyListPage.expectAllRowsHave('Status', 'Closed');
  });

  test('CT-24 combinação de filtros sem correspondência não retorna registros', async ({
    vacancyListPage, createVacancy,
  }) => {
    const activeVacancy = await createVacancy({ status: true });

    await vacancyListPage.goto();
    await vacancyListPage.search({ vacancy: activeVacancy.name, status: 'Closed' });

    await vacancyListPage.expectRecordCount(0);
  });

  test('CT-25 Reset limpa os filtros e restaura a listagem', async ({ vacancyListPage, createVacancy }) => {
    const vacancy = await createVacancy();

    await vacancyListPage.goto();
    await vacancyListPage.search({ vacancy: vacancy.name, status: 'Active' });
    await vacancyListPage.expectRecordCount(1);

    await vacancyListPage.reset();

    await vacancyListPage.expectFiltersCleared();
    await vacancyListPage.expectMoreThanOneRecord();
  });
});
