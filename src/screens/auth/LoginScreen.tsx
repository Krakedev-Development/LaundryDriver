import { DEMO_PASSWORD_HASH } from "../../domain/seed";
import { DriverAccessNotice } from "../../features/auth/ui/DriverAccessNotice";
import { LoginForm } from "../../features/auth/ui/LoginForm";
import { ApiError } from "../../services/api/apiClient";
import {
  authService,
  clearAuthSession,
} from "../../services/auth/authService";
import { useApp } from "../../store/AppProvider";

export function LoginScreen() {
  const { state, execute } = useApp();
  return (
    <LoginForm
      initialEmail="carlos.mendoza@laundryfresh.com"
      demoLabel="Chofer demo"
      notice={<DriverAccessNotice />}
      onLogin={async (email, hash, password) => {
        try {
          const response = await authService.login({ email, password });
          execute((repo) => repo.login(email, hash, response.user));
        } catch (error) {
          const isOffline =
            error instanceof ApiError && error.statusCode === 0;
          const isLocalForcedPasswordDemo =
            state.driver.mustChangePassword &&
            email.trim().toLowerCase() ===
              state.driver.email.trim().toLowerCase() &&
            hash === DEMO_PASSWORD_HASH;

          if (isOffline || isLocalForcedPasswordDemo) {
            execute((repo) => repo.login(email, hash));
            return;
          }
          throw error;
        }
      }}
      onDemo={() => {
        void clearAuthSession();
        execute((repo) => repo.demoLogin("DRIVER"));
      }}
    />
  );
}
