import { DriverAccessNotice } from "../../features/auth/ui/DriverAccessNotice";
import { LoginForm } from "../../features/auth/ui/LoginForm";
import { ApiError } from "../../services/api/apiClient";
import { authService } from "../../services/auth/authService";
import { useApp } from "../../store/AppProvider";

export function LoginScreen() {
  const { execute } = useApp();
  return (
    <LoginForm
      notice={<DriverAccessNotice />}
      onLogin={async (email, hash, password) => {
        try {
          const response = await authService.login({ email, password });
          execute((repo) => repo.login(email, hash, response.user));
        } catch (error) {
          // Sin conexión se permite entrar con la sesión ya guardada en el dispositivo.
          if (error instanceof ApiError && error.statusCode === 0) {
            execute((repo) => repo.login(email, hash));
            return;
          }
          throw error;
        }
      }}
    />
  );
}
