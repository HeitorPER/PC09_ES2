import { test } from '../support/fixtures';
import { VacancyListPage } from '../pages/recruitment/VacancyListPage';
import { credentials } from '../support/testData';

// Login é testado sem a sessão salva. Isso também impede que o logout (CT-08)
// invalide a sessão compartilhada pelos demais testes.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('CT-01 login com credenciais válidas acessa o Dashboard', async ({ loginPage, dashboardPage }) => {
    await loginPage.login(credentials.valid.username, credentials.valid.password);

    await dashboardPage.expectLoaded();
  });

  const invalidCredentials = [
    { id: 'CT-02', scenario: 'senha inválida', ...credentials.invalidPassword },
    { id: 'CT-03', scenario: 'usuário inexistente', ...credentials.unknownUser },
    { id: 'CT-04', scenario: 'senha com caixa diferente', ...credentials.wrongCasePassword },
  ];
  for (const { id, scenario, username, password } of invalidCredentials) {
    test(`${id} login com ${scenario} exibe "Invalid credentials"`, async ({ loginPage }) => {
      await loginPage.login(username, password);

      await loginPage.expectInvalidCredentials();
    });
  }

  const emptyFields = [
    { scenario: 'ambos vazios', username: '', password: '' },
    { scenario: 'usuário vazio', username: '', password: credentials.valid.password },
    { scenario: 'senha vazia', username: credentials.valid.username, password: '' },
  ];
  for (const { scenario, username, password } of emptyFields) {
    test(`CT-05 campos obrigatórios: ${scenario}`, async ({ loginPage }) => {
      await loginPage.login(username, password);

      await loginPage.expectRequiredErrors({ username: !username, password: !password });
    });
  }

  test('CT-06 login pela tecla Enter', async ({ loginPage, dashboardPage }) => {
    await loginPage.loginWithEnter(credentials.valid.username, credentials.valid.password);

    await dashboardPage.expectLoaded();
  });

  test('CT-07 campo de senha é mascarado', async ({ loginPage }) => {
    await loginPage.expectPasswordMasked();
  });

  test('CT-08 logout encerra a sessão', async ({ loginPage, dashboardPage }) => {
    await loginPage.login(credentials.valid.username, credentials.valid.password);
    await dashboardPage.expectLoaded();

    await dashboardPage.logout();
    await loginPage.expectOnLoginPage();

    await test.step('página protegida não é mais acessível', async () => {
      await dashboardPage.goto();
      await loginPage.expectOnLoginPage();
    });
  });

  test('CT-09 acesso direto a página protegida sem sessão redireciona ao login', async ({ page, loginPage }) => {
    await page.goto(VacancyListPage.path);

    await loginPage.expectOnLoginPage();
  });
});
