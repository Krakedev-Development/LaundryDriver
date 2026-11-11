import { transact, type LaundryRepository } from '../src/domain/repository';
import { TEST_PASSWORD_HASH, initializeSeededState } from './fixtures/seedState';

export const now = new Date('2026-10-20T12:00:00Z');
export function driverHarness() {
  let state = initializeSeededState(now);
  const harness = {
    get state() { return state; },
    run<T>(action: (repository: LaundryRepository) => T) {
      const result = transact(state, action, now);
      state = result.state;
      return result.result;
    },
    // Inicia sesión con la cuenta del estado de prueba.
    signIn() {
      harness.run(repo => repo.login(state.driver.email, TEST_PASSWORD_HASH));
    },
  };
  return harness;
}
