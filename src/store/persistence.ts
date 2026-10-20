import type { AppState } from "../domain/models";
import { migrateFulfillmentPolicy } from "../domain/fulfillmentPolicy";

export const STORAGE_KEY = "laundry.driver-mvp.v1";
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
export function decodeState(raw: string): AppState {
  const state = JSON.parse(raw) as AppState;
  if (
    !state ||
    state.version !== 1 ||
    !state.driver?.id ||
    !Array.isArray(state.accounts) ||
    !Array.isArray(state.orders) ||
    !Array.isArray(state.customers) ||
    !Array.isArray(state.timeSlots) ||
    !Array.isArray(state.notifications) ||
    !state.chatMessages
  )
    throw Error("Los datos locales no tienen un formato compatible.");
  state.accounts = state.accounts.filter(
    (account) => account.role === "DRIVER",
  );
  if (state.session?.role !== "DRIVER") state.session = null;
  if (
    state.session &&
    (state.session.id !== state.driver.id ||
      !state.accounts.some((account) => account.id === state.session!.id))
  )
    throw Error("La sesión no corresponde a este chofer.");
  return migrateFulfillmentPolicy(state);
}
export class PersistenceQueue {
  private pending: Promise<void> = Promise.resolve();
  constructor(private storage: StorageAdapter) {}
  load(): Promise<AppState | null> {
    return this.storage
      .getItem(STORAGE_KEY)
      .then((raw) => (raw ? decodeState(raw) : null));
  }
  save(state: AppState): Promise<void> {
    const snapshot = JSON.stringify(state);
    const next = this.pending
      .catch(() => {})
      .then(() => this.storage.setItem(STORAGE_KEY, snapshot));
    this.pending = next;
    return next;
  }
  flush(): Promise<void> {
    return this.pending;
  }
}
