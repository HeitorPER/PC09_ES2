# Cenários de Teste Automatizados — OrangeHRM (demo)

**Sistema sob teste:** https://opensource-demo.orangehrmlive.com/
**Funcionalidades:** (1) Login · (2) Recruitment › Vacancies (adição, edição, pesquisa e deleção)
**Ferramenta:** Playwright Test + TypeScript, padrão Page Object

---

## 1. Estratégia

### 1.1 Critérios de caixa preta usados

Os cenários foram derivados só do comportamento observável (requisitos e UI), sem olhar o código do sistema:

| Sigla | Critério | Onde aparece |
|---|---|---|
| **PE** | Particionamento em classes de equivalência (classes válidas e inválidas de cada entrada) | Credenciais, campos obrigatórios, filtros de pesquisa |
| **AVL** | Análise de valor limite (no limite, logo abaixo e logo acima) | "Number of Positions" (1–99), "Vacancy Name" (≤ 50 caracteres) |
| **TD** | Tabela de decisão (combinações de condições → ação) | Login (usuário × senha), combinação de filtros na pesquisa |
| **TE** | Transição de estados | Autenticado ↔ não autenticado; vaga Active ↔ Closed; registro existente → removido |
| **SE** | Suposição de erro (*error guessing*) | Nome duplicado, autocomplete sem seleção, cancelar ações, sensibilidade a maiúsculas |

### 1.2 Função, quantidade e formato dos testes web automatizados

- **Função:** os testes E2E de UI servem para **regressão dos fluxos críticos do usuário**. Eles não substituem testes de unidade ou de API. Seguindo a pirâmide de testes, a suíte de UI fica **pequena e focada**: um teste por regra de negócio relevante, não um por combinação possível.
- **Quantidade:** 28 cenários (9 de Login e 19 de Vacancies, alguns parametrizados). Combinações redundantes da mesma classe de equivalência foram descartadas.
- **Formato:** cada cenário é escrito em **BDD** (`Cenário` / `Dado` / `Quando` / `Então`), que no código corresponde a **Arrange → Act → Assert**. Cada caso:
  - é **independente**: cria a própria massa de dados e a remove ao final, sem depender da ordem de execução;
  - é **determinístico**: usa nomes únicos (timestamp + aleatório) porque o demo é compartilhado e reiniciado com frequência;
  - tem **um objetivo** e asserções explícitas sobre o resultado visível ao usuário;
  - tem um **ID rastreável** (`CT-xx`) no título do teste, ligando-o a este documento.
- **Preparação via API, verificação via UI:** só a ação que está sendo testada passa pela tela. Pré-condições (funcionário gerente, vaga existente) e limpeza usam a API REST do próprio OrangeHRM (`/api/v2`), o que deixa a suíte mais rápida e menos frágil.

### 1.3 Page Object

| Classe | Responsabilidade |
|---|---|
| `BasePage` | Helpers comuns aos componentes OXD: campo por rótulo, select, autocomplete, toast, mensagens de validação |
| `LoginPage` | Tela de login: preencher credenciais, enviar, ler alertas e erros |
| `DashboardPage` | Tela pós-login: cabeçalho, menu do usuário e logout |
| `VacancyListPage` | Lista de vagas: filtros, pesquisa, reset, tabela, deleção (individual e em lote) |
| `VacancyFormPage` | Formulário Add/Edit Vacancy |

Cada classe reúne os três elementos do padrão: **locators**, **métodos de ação** (`login`, `search`, `deleteVacancy`) e **métodos de asserção** (`expectInvalidCredentials`, `expectVacancyListed`, `expectSaved`). Os seletores ficam só nos Page Objects, os specs apenas encadeiam ações e asserções com nomes de negócio, e os POs são entregues aos testes por **fixtures**. A única verificação fora dos POs é a consulta à API (`api.vacancyExists`), que confirma o efeito no back-end e não depende da tela.

### 1.4 Boas práticas Playwright aplicadas

- Locators *user-facing* primeiro (`getByRole`, `getByPlaceholder`, texto do rótulo). CSS só para componentes OXD sem semântica acessível, e sempre encapsulado no PO.
- **Web-first assertions** (`await expect(locator).toBeVisible()/toHaveText()/toHaveURL()`), sem `waitForTimeout` ou *sleeps* fixos.
- Autenticação feita **uma vez** num *setup project*, com `storageState` reutilizado pelos testes autenticados.
- **Fixtures** customizadas para Page Objects, massa de dados e *teardown* automático.
- `test.describe` por funcionalidade, `test.step` para legibilidade do relatório, testes parametrizados para classes de equivalência e limites.
- `baseURL` no config, `trace`/`screenshot`/`video` retidos em falha, `retries` só no CI.
- Paralelismo habilitado (`fullyParallel`), seguro porque os testes não compartilham dados.

---

## 2. Login

Dados válidos: `Admin` / `admin123`. Arquivo: `tests/login.spec.ts`.

```gherkin
Cenário: CT-01 Login com credenciais válidas            # PE (válida), TD
  Dado que estou na página de login
  Quando eu preencher o usuário "Admin" e a senha "admin123"
  E clicar no botão "Login"
  Então serei redirecionado para "/dashboard/index"
  E o cabeçalho "Dashboard" e o menu do usuário estarão visíveis

Cenário: CT-02 Login com senha inválida                 # PE (inválida), TD
  Dado que estou na página de login
  Quando eu realizar o login com o usuário "Admin" e uma senha incorreta
  Então será exibido o alerta "Invalid credentials"
  E continuarei na página de login

Cenário: CT-03 Login com usuário inexistente            # PE (inválida), TD
  Dado que estou na página de login
  Quando eu realizar o login com um usuário inexistente e a senha "admin123"
  Então será exibido o alerta "Invalid credentials"
  E continuarei na página de login

Cenário: CT-04 Senha com caixa diferente                # SE
  Dado que estou na página de login
  Quando eu realizar o login com o usuário "Admin" e a senha "ADMIN123"
  Então será exibido o alerta "Invalid credentials"

Esquema do Cenário: CT-05 Campos obrigatórios vazios    # PE (vazio), TD
  Dado que estou na página de login
  Quando eu realizar o login com usuário "<usuário>" e senha "<senha>"
  Então "Required" será exibido abaixo de cada campo vazio
  E nenhum alerta de credencial será exibido
  E continuarei na página de login
  Exemplos:
    | usuário | senha    |
    |         |          |
    |         | admin123 |
    | Admin   |          |

Cenário: CT-06 Submissão pela tecla Enter               # SE
  Dado que estou na página de login
  Quando eu preencher credenciais válidas
  E pressionar Enter no campo senha
  Então acessarei o Dashboard

Cenário: CT-07 Senha mascarada                          # SE
  Dado que estou na página de login
  Então o campo senha será do tipo "password"

Cenário: CT-08 Logout                                   # TE
  Dado que estou autenticado no Dashboard
  Quando eu abrir o menu do usuário e clicar em "Logout"
  Então voltarei para a página de login
  E, ao reabrir "/dashboard/index", serei redirecionado ao login

Cenário: CT-09 Acesso direto a página protegida sem sessão   # TE
  Dado que não estou autenticado
  Quando eu abrir "/recruitment/viewJobVacancy"
  Então serei redirecionado para a página de login
```

## 3. Recruitment › Vacancies

Contexto comum a todos os cenários: estou autenticado como Admin e existe um funcionário (criado via API) que será o *Hiring Manager*.

### 3.1 Adição — `tests/recruitment/vacancy-add.spec.ts`

```gherkin
Cenário: CT-10 Adicionar vaga só com os campos obrigatórios   # PE (válida)
  Dado que estou na lista de vagas
  Quando eu clicar em "Add"
  E preencher Vacancy Name, Job Title e Hiring Manager
  E clicar em "Save"
  Então serei levado à tela "Edit Vacancy" com os dados salvos
  E a vaga aparecerá na pesquisa com cargo, gerente e status "Active"

Cenário: CT-11 Adicionar vaga com todos os campos             # PE (válida)
  Dado que estou na tela "Add Vacancy"
  Quando eu preencher todos os campos, com Number of Positions "99", Active desligado e Publish ligado
  E clicar em "Save"
  Então, ao recarregar a vaga, todos os valores estarão preservados
  E a lista, filtrada pelo Hiring Manager, exibirá a vaga com status "Closed"

Cenário: CT-12 Salvar formulário vazio                        # PE (vazio)
  Dado que estou na tela "Add Vacancy"
  Quando eu clicar em "Save" sem preencher nada
  Então "Required" será exibido em Vacancy Name, Job Title e Hiring Manager
  E continuarei na tela de adição

Cenário: CT-13 Nome de vaga duplicado                         # SE
  Dado que já existe uma vaga cadastrada
  E estou na tela "Add Vacancy"
  Quando eu informar o mesmo nome em Vacancy Name
  Então será exibido "Already exists" no campo

Cenário: CT-14 Limite de tamanho do nome                      # AVL
  Dado que estou na tela "Add Vacancy"
  Quando eu informar um nome com 51 caracteres
  Então será exibido "Should not exceed 50 characters"
  Quando eu informar um nome com 50 caracteres
  Então nenhuma mensagem de erro será exibida

Esquema do Cenário: CT-15 Limites de Number of Positions      # AVL + PE
  Dado que estou na tela "Add Vacancy"
  Quando eu informar "<valor>" em Number of Positions
  Então o resultado será <resultado>
  Exemplos:
    | valor | resultado                          |
    | 0     | "Should be a number between 1-99"  |
    | 1     | sem erro                           |
    | 99    | sem erro                           |
    | 100   | "Should be a number between 1-99"  |
    | -1    | "Should be a numeric value"        |
    | abc   | "Should be a numeric value"        |

Cenário: CT-16 Hiring Manager digitado sem selecionar sugestão   # SE
  Dado que estou na tela "Add Vacancy" com nome e cargo preenchidos
  Quando eu digitar um nome no Hiring Manager sem escolher uma sugestão
  E clicar em "Save"
  Então será exibido "Invalid" no campo Hiring Manager
  E a vaga não será criada

Cenário: CT-17 Cancelar a adição                              # SE / TE
  Dado que estou na tela "Add Vacancy" com o nome preenchido
  Quando eu clicar em "Cancel"
  Então voltarei para a lista de vagas
  E a vaga não será criada
```

### 3.2 Edição — `tests/recruitment/vacancy-edit.spec.ts`

Contexto: uma vaga ativa foi criada via API e aberta pelo ícone ✏️ da lista.

```gherkin
Cenário: CT-18 Editar nome, descrição e posições              # PE (válida)
  Dado que estou na tela "Edit Vacancy"
  Quando eu alterar o nome, a descrição e o número de posições
  E clicar em "Save"
  Então será exibido "Successfully Saved"
  E, ao recarregar, os novos valores estarão preservados
  E a lista exibirá a vaga com o novo nome

Cenário: CT-19 Desativar vaga (Active → Closed)               # TE
  Dado que estou na tela "Edit Vacancy" de uma vaga ativa
  Quando eu desligar "Active" e clicar em "Save"
  Então será exibido "Successfully Saved"
  E a lista, filtrada pelo Hiring Manager, exibirá status "Closed"

Cenário: CT-20 Remover campo obrigatório na edição            # PE (vazio)
  Dado que estou na tela "Edit Vacancy"
  Quando eu apagar o Vacancy Name e clicar em "Save"
  Então será exibido "Required"
  E nenhuma mensagem de sucesso será exibida
```

### 3.3 Pesquisa — `tests/recruitment/vacancy-search.spec.ts`

```gherkin
Cenário: CT-21 Pesquisar por Vacancy                          # PE
  Dado que existe uma vaga ativa
  E estou na lista de vagas
  Quando eu filtrar por Vacancy = a vaga e clicar em "Search"
  Então será exibido "(1) Record Found"
  E a linha terá o nome, cargo, gerente e status corretos

Cenário: CT-22 Pesquisar por Job Title                        # PE
  Dado que existe uma vaga com o cargo "QA Engineer"
  Quando eu filtrar por Job Title = "QA Engineer" e clicar em "Search"
  Então todas as linhas exibidas terão esse cargo

Cenário: CT-23 Pesquisar por Status = Closed                  # PE
  Dado que existe uma vaga fechada
  Quando eu filtrar por Status = "Closed" e clicar em "Search"
  Então todas as linhas exibidas terão status "Closed"

Cenário: CT-24 Combinação de filtros sem resultado            # TD
  Dado que existe uma vaga ativa
  Quando eu filtrar por Vacancy = a vaga e Status = "Closed"
  E clicar em "Search"
  Então será exibido "No Records Found"

Cenário: CT-25 Reset dos filtros                              # SE
  Dado que estou na lista de vagas com filtros aplicados
  Quando eu clicar em "Reset"
  Então todos os filtros voltarão para "-- Select --"
  E a lista voltará a exibir vários registros
```

### 3.4 Deleção — `tests/recruitment/vacancy-delete.spec.ts`

```gherkin
Cenário: CT-26 Deletar vaga pelo ícone da linha               # TE
  Dado que existe uma vaga e ela aparece na pesquisa
  Quando eu clicar no ícone 🗑️ da linha
  Então será exibida a confirmação "Are you Sure?"
  Quando eu clicar em "Yes, Delete"
  Então será exibido "Successfully Deleted"
  E a vaga não aparecerá mais na lista

Cenário: CT-27 Cancelar deleção                               # SE
  Dado que existe uma vaga e ela aparece na pesquisa
  Quando eu clicar no ícone 🗑️ e depois em "No, Cancel"
  Então o diálogo será fechado
  E a vaga continuará listada

Cenário: CT-28 Deleção em lote                                # TE
  Dado que existem duas vagas do mesmo Hiring Manager
  E a lista está filtrada por esse gerente
  Quando eu marcar as duas vagas e clicar em "Delete Selected"
  E confirmar em "Yes, Delete"
  Então será exibido "Successfully Deleted"
  E nenhuma das vagas existirá mais
```

---

### 3.5 Observações levantadas na exploração do sistema

- O filtro **Vacancy** da lista só oferece vagas **ativas**. Por isso, vagas fechadas (CT-11, CT-19) são localizadas pelo filtro **Hiring Manager**, que é um funcionário exclusivo de cada teste.
- O campo **Hiring Manager** exibe o nome do meio vazio como espaço duplo ("Nome  Sobrenome").
- Ao abrir uma vaga para edição, o sistema dispara uma validação assíncrona de nome único. O Page Object espera essa validação terminar antes de interagir; sem isso o CT-20 ficava intermitente.
- Após salvar uma **nova** vaga, o sistema redireciona para a edição (`/addJobVacancy/{id}`) sem exibir toast. Na edição e na deleção o toast aparece.

## 4. Mapa cenário → arquivo

| Arquivo | Cenários |
|---|---|
| `tests/login.spec.ts` | CT-01 a CT-09 |
| `tests/recruitment/vacancy-add.spec.ts` | CT-10 a CT-17 |
| `tests/recruitment/vacancy-edit.spec.ts` | CT-18 a CT-20 |
| `tests/recruitment/vacancy-search.spec.ts` | CT-21 a CT-25 |
| `tests/recruitment/vacancy-delete.spec.ts` | CT-26 a CT-28 |

## 5. Execução

```bash
npm install
npx playwright install chromium
npm test                 # todos os testes (headless)
npm run test:headed      # com navegador visível
npm run test:ui          # modo UI do Playwright
npm run report           # abre o último relatório HTML
```
