# Automação de Testes Web — OrangeHRM

Atividade de automação de testes E2E com **Playwright** e o padrão **Page Object** no site [OrangeHRM demo](https://opensource-demo.orangehrmlive.com/), cobrindo:

- Login;
- Recruitment: adição, edição, pesquisa e deleção de vacancies.

A lista de cenários de teste está em [`cenarios.md`](cenarios.md).

## Como executar

```bash
npm install
npx playwright install chromium
npm test
```
