import { authenticateSession } from "@laundry/mobile-auth";
import { facilities } from "./catalog";
import {
  type AppState,
  type OperationalStatus,
  type Order,
  type OrderStatus,
} from "./models";
import { PlantOperations } from "./operations/PlantOperations";
import { clone, refreshSchedule } from "./state";
import {
  authService,
  DRIVER_ONLY_ERROR_MESSAGE,
  type AuthLoginResponse,
  type AuthUser,
} from "../services/auth/authService";
export {
  clone,
  initializeState,
  refreshSchedule,
  today,
  scheduleDate,
} from "./state";
export { visibleOrders, slotRange } from "./selectors";

export class LaundryRepository extends PlantOperations {
  authenticateFromApi(user: AuthUser, passwordHash = ""): void {
    if (!user || user.role !== "DRIVER") {
      throw Error(DRIVER_ONLY_ERROR_MESSAGE);
    }

    const prevDriverId = this.state.driver.id;
    const normalizedEmail = user.email.trim().toLowerCase();
    const resolvedName = user.name.trim() || this.state.driver.name;
    const resolvedFacilityName =
      (user.facilityName && user.facilityName.trim()) ||
      (user.facilityId
        ? facilities.find((f) => f.id === user.facilityId)?.name
        : undefined) ||
      this.state.driver.facilityName;

    this.state.driver = {
      ...this.state.driver,
      id: user.id,
      name: resolvedName,
      email: normalizedEmail,
      facilityName: resolvedFacilityName,
      mustChangePassword: user.status === "PASSWORD_CHANGE_REQUIRED",
    };

    for (const order of this.state.orders) {
      if (
        order.assignedDriverId === prevDriverId ||
        order.assignedDriverId === user.id
      ) {
        order.assignedDriverId = user.id;
        order.assignedDriverName = resolvedName;
      }
    }

    for (const messages of Object.values(this.state.chatMessages)) {
      for (const message of messages) {
        if (
          message.senderRole === "DRIVER" &&
          (message.senderId === prevDriverId || message.senderId === user.id)
        ) {
          message.senderId = user.id;
          message.senderName = resolvedName;
        }
      }
    }

    const existingAccount = this.state.accounts.find(
      (account) =>
        account.id === user.id ||
        account.id === prevDriverId ||
        account.email.trim().toLowerCase() === normalizedEmail ||
        account.role === "DRIVER",
    );

    if (existingAccount) {
      existingAccount.id = user.id;
      existingAccount.email = normalizedEmail;
      existingAccount.role = "DRIVER";
      if (passwordHash) {
        existingAccount.passwordHash = passwordHash;
      }
    } else {
      this.state.accounts.push({
        id: user.id,
        email: normalizedEmail,
        role: "DRIVER",
        passwordHash,
      });
    }

    this.state.session = { id: user.id, role: "DRIVER" };
  }

  login(email: string, passwordHash: string, apiUser?: AuthUser): void {
    if (apiUser) {
      this.authenticateFromApi(apiUser, passwordHash);
      return;
    }
    this.state.session = authenticateSession(
      this.state.accounts,
      email,
      passwordHash,
      "DRIVER",
    );
  }

  async loginWithApi(
    email: string,
    password: string,
    passwordHash = "",
  ): Promise<AuthLoginResponse> {
    const response = await authService.login({ email, password });
    this.authenticateFromApi(response.user, passwordHash);
    return response;
  }

  logout(): void {
    this.state.session = null;
    void authService.logout();
  }

  changePassword(
    currentHash: string,
    newHash: string,
    forced = false,
    apiUser?: AuthUser,
  ): void {
    if (apiUser) {
      this.authenticateFromApi(
        {
          ...apiUser,
          status: "ACTIVE",
        },
        newHash,
      );
      this.state.driver.mustChangePassword = false;
      return;
    }

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

  async changePasswordWithApi(
    currentPassword: string,
    newPassword: string,
    newPasswordHash = "",
    forced = false,
  ): Promise<AuthLoginResponse> {
    const response = await authService.changePassword({
      currentPassword,
      newPassword,
    });
    this.changePassword("", newPasswordHash, forced, response.user);
    return response;
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

  syncAssignedOrders(apiOrders: Order[]): void {
    const driverId = this.state.session?.id || this.state.driver.id;
    const driverName = this.state.driver.name;

    for (const apiOrder of apiOrders) {
      const existingIndex = this.state.orders.findIndex(
        (o) => o.id === apiOrder.id,
      );
      const syncedOrder: Order = {
        ...apiOrder,
        assignedDriverId: driverId,
        assignedDriverName: driverName,
      };

      if (existingIndex >= 0) {
        this.state.orders[existingIndex] = {
          ...this.state.orders[existingIndex],
          ...syncedOrder,
        };
      } else {
        this.state.orders.unshift(syncedOrder);
      }
    }
  }

  updateOrderVersion(
    orderId: string,
    version: number,
    status?: OrderStatus,
  ): void {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (order) {
      order.version = version;
      if (status) {
        order.status = status;
      }
    }
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
