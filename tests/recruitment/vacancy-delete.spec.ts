import { test, expect } from '../../support/fixtures';

test.describe('Recruitment › Vacancies › Deleção', () => {
  test('CT-26 deleta vaga pelo ícone da linha', async ({ api, vacancyListPage, createVacancy }) => {
    const vacancy = await createVacancy();
    await vacancyListPage.goto();
    await vacancyListPage.search({ vacancy: vacancy.name });

    await vacancyListPage.clickDelete(vacancy.name);
    await vacancyListPage.expectDeleteConfirmation();
    await vacancyListPage.confirmDeletion();

    await vacancyListPage.expectDeleted();
    await vacancyListPage.expectVacancyNotListed(vacancy.name);
    expect(await api.vacancyExists(vacancy.name)).toBe(false);
  });

  test('CT-27 cancelar a deleção mantém a vaga', async ({ api, vacancyListPage, createVacancy }) => {
    const vacancy = await createVacancy();
    await vacancyListPage.goto();
    await vacancyListPage.search({ vacancy: vacancy.name });

    await vacancyListPage.clickDelete(vacancy.name);
    await vacancyListPage.cancelDeletion();

    await vacancyListPage.expectDeleteConfirmationClosed();
    await vacancyListPage.expectVacancyListed(vacancy.name);
    expect(await api.vacancyExists(vacancy.name)).toBe(true);
  });

  test('CT-28 deleta vagas selecionadas em lote', async ({ api, vacancyListPage, createVacancy, hiringManager }) => {
    const vacancies = [await createVacancy(), await createVacancy()];
    await vacancyListPage.goto();
    // O gerente é exclusivo do teste, então o filtro retorna exatamente as duas vagas criadas.
    await vacancyListPage.search({ hiringManager: hiringManager.fullName });
    await vacancyListPage.expectRecordCount(2);

    for (const v of vacancies) await vacancyListPage.selectRow(v.name);
    await vacancyListPage.deleteSelected();
    await vacancyListPage.confirmDeletion();

    await vacancyListPage.expectDeleted();
    await vacancyListPage.expectRecordCount(0);
    for (const v of vacancies) expect(await api.vacancyExists(v.name)).toBe(false);
  });
});
