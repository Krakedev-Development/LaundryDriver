import { initializeState, transact, type LaundryRepository } from '../src/domain/repository';

export const now = new Date('2026-10-20T12:00:00Z');
export function driverHarness() {
  let state = initializeState(now);
  return {
    get state() { return state; },
    run<T>(action: (repository: LaundryRepository) => T) {
      const result = transact(state, action, now);
      state = result.state;
      return result.result;
    },
  };
}
