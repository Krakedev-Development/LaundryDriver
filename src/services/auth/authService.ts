import AsyncStorage from "@react-native-async-storage/async-storage";
import { facilities } from "../../domain/catalog";
import { apiClient } from "../api/apiClient";

export const ACCESS_TOKEN_KEY = "laundry.driver.auth.accessToken";
export const REFRESH_TOKEN_KEY = "laundry.driver.auth.refreshToken";
export const USER_PROFILE_KEY = "laundry.driver.auth.userProfile";
export const TEMP_PASSWORD_KEY = "laundry.driver.auth.tempPassword";

export const DRIVER_ONLY_ERROR_MESSAGE =
  "Esta aplicación es exclusiva para choferes autorizados.";

export type BackendUserRole = "CLIENT" | "DRIVER" | "ADMIN" | "SUPERVISOR";
export type BackendUserStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "PASSWORD_CHANGE_REQUIRED";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: BackendUserRole;
  status: BackendUserStatus;
  facilityId: string | null;
  facilityName?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthLoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword?: string;
  newPassword: string;
}

interface FacilityResponse {
  id: string;
  name: string;
}

const memoryStorage = new Map<string, string>();

async function storageGetItem(key: string): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      memoryStorage.set(key, value);
      return value;
    }
  } catch {
    // Fallback to in-memory storage when native module is unavailable (e.g. Node unit tests)
  }
  return memoryStorage.get(key) ?? null;
}

async function storageMultiSet(entries: [string, string][]): Promise<void> {
  for (const [key, value] of entries) {
    memoryStorage.set(key, value);
  }
  try {
    await AsyncStorage.multiSet(entries);
  } catch {
    // Fallback to in-memory storage when native module is unavailable
  }
}

async function storageMultiRemove(keys: string[]): Promise<void> {
  for (const key of keys) {
    memoryStorage.delete(key);
  }
  try {
    await AsyncStorage.multiRemove(keys);
  } catch {
    // Fallback to in-memory storage when native module is unavailable
  }
}

async function resolveFacilityName(
  user: AuthUser,
  accessToken: string,
): Promise<string | null> {
  if (user.facilityName && user.facilityName.trim()) {
    return user.facilityName.trim();
  }
  if (!user.facilityId) {
    return null;
  }

  const seededFacility = facilities.find((f) => f.id === user.facilityId);
  if (seededFacility) {
    return seededFacility.name;
  }

  if (user.status === "ACTIVE") {
    try {
      const facility = await apiClient.get<FacilityResponse>(
        `/facilities/${user.facilityId}`,
        { accessToken },
      );
      if (facility && typeof facility.name === "string" && facility.name.trim()) {
        return facility.name.trim();
      }
    } catch {
      // Ignore facility lookup errors and retain existing/default facility name
    }
  }

  return null;
}

function normalizeTokenResponse(
  raw: AuthLoginResponse | AuthTokens,
): { tokens: AuthTokens; user?: AuthUser } {
  if (
    raw &&
    typeof raw === "object" &&
    "tokens" in raw &&
    raw.tokens &&
    typeof raw.tokens.accessToken === "string"
  ) {
    return {
      tokens: raw.tokens,
      user: raw.user,
    };
  }
  return {
    tokens: raw as AuthTokens,
  };
}

export async function saveAuthSession(
  session: AuthLoginResponse,
  tempPassword?: string | null,
): Promise<void> {
  const entries: [string, string][] = [
    [ACCESS_TOKEN_KEY, session.tokens.accessToken],
    [REFRESH_TOKEN_KEY, session.tokens.refreshToken],
    [USER_PROFILE_KEY, JSON.stringify(session.user)],
  ];
  if (typeof tempPassword === "string" && tempPassword.length > 0) {
    entries.push([TEMP_PASSWORD_KEY, tempPassword]);
  }
  await storageMultiSet(entries);
  if (tempPassword === null) {
    await storageMultiRemove([TEMP_PASSWORD_KEY]);
  }
}

export async function clearAuthSession(): Promise<void> {
  await storageMultiRemove([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    USER_PROFILE_KEY,
    TEMP_PASSWORD_KEY,
  ]);
}

export async function getStoredAuthSession(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  tempPassword: string | null;
}> {
  const [accessToken, refreshToken, rawUser, tempPassword] = await Promise.all([
    storageGetItem(ACCESS_TOKEN_KEY),
    storageGetItem(REFRESH_TOKEN_KEY),
    storageGetItem(USER_PROFILE_KEY),
    storageGetItem(TEMP_PASSWORD_KEY),
  ]);

  let user: AuthUser | null = null;
  if (rawUser) {
    try {
      user = JSON.parse(rawUser) as AuthUser;
    } catch {
      user = null;
    }
  }

  return { accessToken, refreshToken, user, tempPassword };
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthLoginResponse> {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const response = await apiClient.post<AuthLoginResponse>("/auth/login", {
      email: normalizedEmail,
      password: payload.password,
    });

    if (!response?.user || response.user.role !== "DRIVER") {
      if (response?.tokens?.accessToken) {
        try {
          await apiClient.post(
            "/auth/logout",
            { refreshToken: response.tokens.refreshToken },
            { accessToken: response.tokens.accessToken },
          );
        } catch {
          // Best-effort token revocation for unauthorized roles
        }
      }
      await clearAuthSession();
      throw new Error(DRIVER_ONLY_ERROR_MESSAGE);
    }

    const facilityName = await resolveFacilityName(
      response.user,
      response.tokens.accessToken,
    );
    const enrichedUser: AuthUser = {
      ...response.user,
      facilityName: facilityName ?? response.user.facilityName ?? null,
    };

    const enrichedResponse: AuthLoginResponse = {
      user: enrichedUser,
      tokens: response.tokens,
    };

    await saveAuthSession(
      enrichedResponse,
      enrichedUser.status === "PASSWORD_CHANGE_REQUIRED"
        ? payload.password
        : null,
    );
    return enrichedResponse;
  },

  async changePassword(
    payload: ChangePasswordPayload,
  ): Promise<AuthLoginResponse> {
    const { accessToken, user: storedUser, tempPassword } =
      await getStoredAuthSession();
    if (!accessToken) {
      throw new Error("Sesión expirada. Inicia sesión nuevamente.");
    }

    const effectiveCurrentPassword =
      payload.currentPassword && payload.currentPassword.length > 0
        ? payload.currentPassword
        : tempPassword || "";

    if (!effectiveCurrentPassword) {
      throw new Error("Debes ingresar tu contraseña actual.");
    }

    const rawResponse = await apiClient.post<AuthLoginResponse | AuthTokens>(
      "/auth/change-password",
      {
        currentPassword: effectiveCurrentPassword,
        newPassword: payload.newPassword,
      },
      { accessToken },
    );

    const { tokens, user: inlineUser } = normalizeTokenResponse(rawResponse);

    let updatedUser: AuthUser | null = inlineUser ?? null;
    if (!updatedUser) {
      try {
        updatedUser = await apiClient.get<AuthUser>("/auth/me", {
          accessToken: tokens.accessToken,
        });
      } catch {
        if (storedUser) {
          updatedUser = {
            ...storedUser,
            status: "ACTIVE",
          };
        }
      }
    }

    if (!updatedUser) {
      throw new Error("No se pudo verificar el perfil del chofer.");
    }

    if (updatedUser.role !== "DRIVER") {
      await clearAuthSession();
      throw new Error(DRIVER_ONLY_ERROR_MESSAGE);
    }

    const facilityName = await resolveFacilityName(
      updatedUser,
      tokens.accessToken,
    );
    const finalUser: AuthUser = {
      ...updatedUser,
      status: "ACTIVE",
      facilityName:
        facilityName ??
        updatedUser.facilityName ??
        storedUser?.facilityName ??
        null,
    };

    const session: AuthLoginResponse = {
      user: finalUser,
      tokens,
    };

    await saveAuthSession(session, null);
    return session;
  },

  async refresh(): Promise<AuthLoginResponse | null> {
    const { refreshToken, user: storedUser } = await getStoredAuthSession();
    if (!refreshToken) return null;

    try {
      const rawResponse = await apiClient.post<AuthLoginResponse | AuthTokens>(
        "/auth/refresh",
        { refreshToken },
      );
      const { tokens, user: inlineUser } = normalizeTokenResponse(rawResponse);

      let updatedUser: AuthUser | null = inlineUser ?? null;
      if (!updatedUser) {
        try {
          updatedUser = await apiClient.get<AuthUser>("/auth/me", {
            accessToken: tokens.accessToken,
          });
        } catch {
          updatedUser = storedUser;
        }
      }

      if (!updatedUser || updatedUser.role !== "DRIVER") {
        await clearAuthSession();
        return null;
      }

      const facilityName = await resolveFacilityName(
        updatedUser,
        tokens.accessToken,
      );
      const session: AuthLoginResponse = {
        user: {
          ...updatedUser,
          facilityName:
            facilityName ??
            updatedUser.facilityName ??
            storedUser?.facilityName ??
            null,
        },
        tokens,
      };
      await saveAuthSession(session);
      return session;
    } catch {
      await clearAuthSession();
      return null;
    }
  },

  async logout(): Promise<void> {
    const { accessToken, refreshToken } = await getStoredAuthSession();
    if (accessToken && refreshToken) {
      try {
        await apiClient.post(
          "/auth/logout",
          { refreshToken },
          { accessToken },
        );
      } catch {
        // Ignore network errors during logout cleanup
      }
    }
    await clearAuthSession();
  },
};
