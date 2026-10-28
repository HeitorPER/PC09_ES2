import { test } from '../../support/fixtures';
import type { Vacancy } from '../../support/OrangeHrmApi';
import { messages, uniqueVacancyName } from '../../support/testData';

test.describe('Recruitment › Vacancies › Edição', () => {
  let vacancy: Vacancy;

  test.beforeEach(async ({ createVacancy, vacancyListPage, vacancyFormPage }) => {
    vacancy = await createVacancy();
    await vacancyListPage.goto();
    await vacancyListPage.search({ vacancy: vacancy.name });
    await vacancyFormPage.openEdit(() => vacancyListPage.openEdit(vacancy.name));
    await vacancyFormPage.expectEditFormOpen();
  });

  test('CT-18 edita nome, descrição e número de posições', async ({ page, vacancyFormPage, vacancyListPage }) => {
    const changes = {
      name: uniqueVacancyName('QA Editada'),
      description: 'Descrição alterada pela automação.',
      numOfPositions: '5',
    };

    await vacancyFormPage.fill(changes);
    await vacancyFormPage.save();
    await vacancyFormPage.expectSaved();

    await test.step('valores persistem após recarregar', async () => {
      await vacancyFormPage.openEdit(() => page.reload());
      await vacancyFormPage.expectValues(changes);
    });

    await test.step('lista exibe o novo nome', async () => {
      await vacancyListPage.goto();
      await vacancyListPage.search({ vacancy: changes.name });
      await vacancyListPage.expectVacancyListed(changes.name);
    });
  });

  test('CT-19 desativar a vaga altera o status para Closed', async ({ vacancyFormPage, vacancyListPage, hiringManager }) => {
    await vacancyFormPage.expectActive(true);

    await vacancyFormPage.fill({ active: false });
    await vacancyFormPage.save();
    await vacancyFormPage.expectSaved();

    await vacancyListPage.goto();
    // O filtro "Vacancy" só lista vagas ativas; o gerente é exclusivo do teste.
    await vacancyListPage.search({ hiringManager: hiringManager.fullName });
    await vacancyListPage.expectVacancyListed(vacancy.name, { status: 'Closed' });
  });

  test('CT-20 remover o nome na edição exige campo obrigatório', async ({ vacancyFormPage }) => {
    await vacancyFormPage.fill({ name: '' });
    await vacancyFormPage.save();

    await vacancyFormPage.expectRequired('Vacancy Name');
    await vacancyFormPage.expectNoToast(messages.saved);
  });
});
