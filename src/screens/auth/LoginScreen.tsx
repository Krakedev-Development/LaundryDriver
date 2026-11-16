import { Text, View } from "react-native";
import { DriverAccessNotice } from "../../features/auth/ui/DriverAccessNotice";
import { LoginForm } from "../../features/auth/ui/LoginForm";
import { ApiError } from "../../services/api/apiClient";
import { authService } from "../../services/auth/authService";
import { useApp } from "../../store/AppProvider";

export function LoginScreen() {
  const { execute, sessionNotice, clearSessionNotice } = useApp();
  return (
    <LoginForm
      notice={
        <View style={{ gap: 8 }}>
          {sessionNotice ? (
            <Text
              accessibilityRole="alert"
              testID="session_notice"
              style={{ color: "#B45309", fontWeight: "600" }}
            >
              {sessionNotice}
            </Text>
          ) : null}
          <DriverAccessNotice />
        </View>
      }
      onLogin={async (email, hash, password) => {
        try {
          const response = await authService.login({ email, password });
          execute((repo) => repo.login(email, hash, response.user));
          clearSessionNotice();
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
