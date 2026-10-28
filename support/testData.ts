export const credentials = {
  valid: { username: 'Admin', password: 'admin123' },
  invalidPassword: { username: 'Admin', password: 'senhaErrada123' },
  unknownUser: { username: 'usuario.inexistente', password: 'admin123' },
  wrongCasePassword: { username: 'Admin', password: 'ADMIN123' },
} as const;

export const messages = {
  required: 'Required',
  invalidCredentials: 'Invalid credentials',
  invalid: 'Invalid',
  alreadyExists: 'Already exists',
  nameTooLong: 'Should not exceed 50 characters',
  positionsOutOfRange: 'Should be a number between 1-99',
  positionsNotNumeric: 'Should be a numeric value',
  saved: 'Successfully Saved',
  deleted: 'Successfully Deleted',
  noRecords: 'No Records Found',
} as const;

export const DEFAULT_JOB_TITLE = 'QA Engineer';

/** Sufixo único: o demo é compartilhado, então nomes fixos colidiriam entre execuções. */
export function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function uniqueVacancyName(prefix = 'QA Vaga'): string {
  return `${prefix} ${uniqueSuffix()}`;
}
