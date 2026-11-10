import { Text, View } from "react-native";
import { Button } from "../../../components/ui";
import { loginStyles } from "../../../components/LoginPresentation";

export function LoginAccessOptions({ onRegister }: { onRegister?: () => void }) {
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
      ) : null}
    </>
  );
}
