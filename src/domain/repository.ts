import { authenticateSession } from "@laundry/mobile-auth";
import { DEMO_PASSWORD_HASH } from "./seed";
import { type AppState, type OperationalStatus, type Role } from "./models";
import { PlantOperations } from "./operations/PlantOperations";
import { clone, refreshSchedule } from "./state";
export {
  clone,
  initializeState,
  refreshSchedule,
  today,
  scheduleDate,
} from "./state";
export { visibleOrders, slotRange } from "./selectors";
export class LaundryRepository extends PlantOperations {
  login(email: string, passwordHash: string): void {
    this.state.session = authenticateSession(
      this.state.accounts,
      email,
      passwordHash,
      "DRIVER",
    );
  }
  demoLogin(role: Role): void {
    if (role !== "DRIVER") throw Error("Esta app es exclusiva para choferes.");
    this.state.session = { id: this.state.driver.id, role: "DRIVER" };
  }
  logout(): void {
    this.state.session = null;
  }
  changePassword(currentHash: string, newHash: string, forced = false): void {
    const a = this.state.accounts.find((a) => a.id === this.state.session?.id);
    if (!a || (!forced && a.passwordHash !== currentHash))
      throw Error("La contraseña actual es incorrecta.");
    if (
      forced &&
      (a.role !== "DRIVER" || !this.state.driver.mustChangePassword)
    )
      throw Error("No hay cambio obligatorio pendiente.");
    a.passwordHash = newHash;
    if (a.role === "DRIVER") this.state.driver.mustChangePassword = false;
  }
  sendChatMessage(orderId: string, text: string): void {
    const o = this.order(orderId);
    if (!text.trim()) throw Error("Escribe un mensaje.");
    const session = this.state.session!;
    const sender = this.state.driver;
    (this.state.chatMessages[o.id] ??= []).push({
      id: this.id("msg"),
      orderId,
      senderId: sender.id,
      senderName: sender.name,
      senderRole: session.role,
      text: text.trim(),
      timestamp: this.stamp(),
    });
  }
  setDriverOperationalStatus(status: OperationalStatus): void {
    if (this.state.session?.role !== "DRIVER")
      throw Error("Se requiere sesión de chofer.");
    this.state.driver.operationalStatus = status;
  }
  simulateTemporaryPassword(): void {
    this.state.driver.mustChangePassword = true;
    this.state.accounts.find((a) => a.role === "DRIVER")!.passwordHash =
      DEMO_PASSWORD_HASH;
    this.demoLogin("DRIVER");
  }
}
export function transact<T>(
  state: AppState,
  action: (repo: LaundryRepository) => T,
  now = new Date(),
): { state: AppState; result: T } {
  const next = clone(state);
  refreshSchedule(next, now);
  const repo = new LaundryRepository(next, now);
  const result = action(repo);
  return { state: repo.state, result };
}
