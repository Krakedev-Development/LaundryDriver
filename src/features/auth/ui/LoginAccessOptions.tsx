import { Text, View } from "react-native";
import { Button } from "../../../components/ui";
import { loginStyles } from "../../../components/LoginPresentation";

export function LoginAccessOptions({
  demoLabel,
  onDemo,
  onRegister,
}: {
  demoLabel: string;
  onDemo(): void;
  onRegister?: () => void;
}) {
  return (
    <>
      {onRegister ? (
        <View style={loginStyles.registration}>
          <Text style={loginStyles.registrationPrompt}>
            ¿Aún no tienes cuenta?
          </Text>
          <Button
            label="Crear cuenta"
            secondary
            variant="ghost"
            style={loginStyles.register}
            textStyle={loginStyles.registerText}
            testID="login_register_button"
            onPress={onRegister}
          />
        </View>
      ) : (
        <Text style={loginStyles.registrationPrompt}>
          Tu cuenta de chofer es creada por administración. Contacta a tu
          administrador si necesitas acceso.
        </Text>
      )}
      <View style={loginStyles.demo}>
        <Text style={loginStyles.demoTitle}>Acceso rápido demo</Text>
        <View style={loginStyles.demoRow}>
          <Button
            label={demoLabel}
            secondary
            style={loginStyles.demoButton}
            onPress={onDemo}
          />
        </View>
      </View>
    </>
  );
}
