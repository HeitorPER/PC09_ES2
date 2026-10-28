import { test, expect } from '../../support/fixtures';
import { messages, uniqueVacancyName } from '../../support/testData';

test.describe('Recruitment › Vacancies › Adição', () => {
  test('CT-10 adiciona vaga apenas com campos obrigatórios', async ({
    vacancyListPage, vacancyFormPage, jobTitle, hiringManager,
  }) => {
    const name = uniqueVacancyName();

    await vacancyListPage.goto();
    await vacancyListPage.clickAdd();
    await vacancyFormPage.expectAddFormOpen();

    await vacancyFormPage.fill({
      name,
      jobTitle: jobTitle.title,
      hiringManager: hiringManager.fullName,
      hiringManagerHint: hiringManager.lastName,
    });
    await vacancyFormPage.save();

    await vacancyFormPage.expectEditFormOpen();
    await vacancyFormPage.expectValues({ name });

    await test.step('vaga aparece na lista', async () => {
      await vacancyListPage.goto();
      await vacancyListPage.search({ vacancy: name });
      await vacancyListPage.expectVacancyListed(name, {
        jobTitle: jobTitle.title,
        hiringManager: hiringManager.fullName,
        status: 'Active',
      });
    });
  });

  test('CT-11 adiciona vaga com todos os campos preenchidos', async ({
    page, vacancyListPage, vacancyFormPage, jobTitle, hiringManager,
  }) => {
    const data = {
      name: uniqueVacancyName(),
      jobTitle: jobTitle.title,
      description: 'Vaga criada pela automação de testes Playwright.',
      hiringManager: hiringManager.fullName,
      hiringManagerHint: hiringManager.lastName,
      numOfPositions: '99',
      active: false,
      published: true,
    };

    await vacancyFormPage.gotoAdd();
    await vacancyFormPage.fill(data);
    await vacancyFormPage.save();
    await vacancyFormPage.expectEditFormOpen();

    await test.step('valores persistem após recarregar', async () => {
      await vacancyFormPage.openEdit(() => page.reload());
      await vacancyFormPage.expectValues(data);
    });

    await test.step('lista exibe a vaga como Closed', async () => {
      await vacancyListPage.goto();
      // O filtro "Vacancy" só lista vagas ativas; o gerente é exclusivo do teste.
      await vacancyListPage.search({ hiringManager: hiringManager.fullName });
      await vacancyListPage.expectVacancyListed(data.name, { status: 'Closed' });
    });
  });

  test('CT-12 salvar formulário vazio exige campos obrigatórios', async ({ vacancyFormPage }) => {
    await vacancyFormPage.gotoAdd();
    await vacancyFormPage.save();

    await vacancyFormPage.expectRequired('Vacancy Name', 'Job Title', 'Hiring Manager');
    await vacancyFormPage.expectStillOnAddForm();
  });

  test('CT-13 nome de vaga duplicado é rejeitado', async ({ vacancyFormPage, createVacancy }) => {
    const existing = await createVacancy();

    await vacancyFormPage.gotoAdd();
    await vacancyFormPage.fill({ name: existing.name });

    await vacancyFormPage.expectFieldError('Vacancy Name', messages.alreadyExists);
  });

  test('CT-14 nome da vaga aceita no máximo 50 caracteres', async ({ vacancyFormPage }) => {
    await vacancyFormPage.gotoAdd();

    await vacancyFormPage.fill({ name: 'A'.repeat(51) });
    await vacancyFormPage.expectFieldError('Vacancy Name', messages.nameTooLong);

    await vacancyFormPage.fill({ name: 'A'.repeat(50) });
    await vacancyFormPage.expectNoFieldError('Vacancy Name');
  });

  const positions = [
    { value: '0', error: messages.positionsOutOfRange },
    { value: '1', error: null },
    { value: '99', error: null },
    { value: '100', error: messages.positionsOutOfRange },
    { value: '-1', error: messages.positionsNotNumeric },
    { value: 'abc', error: messages.positionsNotNumeric },
  ];
  for (const { value, error } of positions) {
    test(`CT-15 Number of Positions = "${value}" ${error ? 'é inválido' : 'é válido'}`, async ({ vacancyFormPage }) => {
      await vacancyFormPage.gotoAdd();
      await vacancyFormPage.fill({ numOfPositions: value });

      if (error) await vacancyFormPage.expectFieldError('Number of Positions', error);
      else await vacancyFormPage.expectNoFieldError('Number of Positions');
    });
  }

  test('CT-16 Hiring Manager digitado sem selecionar sugestão é inválido', async ({
    api, vacancyFormPage, jobTitle,
  }) => {
    const name = uniqueVacancyName();

    await vacancyFormPage.gotoAdd();
    await vacancyFormPage.fill({ name, jobTitle: jobTitle.title });
    await vacancyFormPage.typeHiringManagerWithoutSelecting('Gerente Inexistente');
    await vacancyFormPage.save();

    await vacancyFormPage.expectFieldError('Hiring Manager', messages.invalid);
    await vacancyFormPage.expectStillOnAddForm();
    expect(await api.vacancyExists(name)).toBe(false);
  });

  test('CT-17 cancelar a adição não cria a vaga', async ({ api, vacancyListPage, vacancyFormPage }) => {
    const name = uniqueVacancyName();

    await vacancyListPage.goto();
    await vacancyListPage.clickAdd();
    await vacancyFormPage.fill({ name });
    await vacancyFormPage.cancel();

    await vacancyListPage.expectLoaded();
    expect(await api.vacancyExists(name)).toBe(false);
  });
});
