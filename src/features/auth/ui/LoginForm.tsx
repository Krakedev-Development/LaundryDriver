import { LoginAccessOptions } from "./LoginAccessOptions";
import { useState, type ReactNode } from "react";
import { Text, View } from "react-native";
import { Page } from "../../../components/Page";
import { Body, Button, Card, Field, useAction } from "../../../components/ui";
import { LoginBrand, loginStyles } from "../../../components/LoginPresentation";
import { passwordHash } from "../../../services/passwordHash";
export function LoginForm({
  onLogin,
  onRegister,
  onForgotPassword,
  notice,
}: {
  onLogin(email: string, hash: string, password: string): void | Promise<void>;
  onRegister?: () => void;
  // Sin esta función (p. ej. choferes, que gestiona el administrador) se muestra soporte.
  onForgotPassword?: () => void;
  notice?: ReactNode;
}) {
  const a = useAction();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  return (
    <Page backgroundColor="#F7F8FD" contentContainerStyle={loginStyles.page}>
      <View style={loginStyles.content}>
        <LoginBrand />
        <Body muted style={loginStyles.subtitle}>
          Tu ropa siempre limpia, fresca y natural.
        </Body>
        <Card style={loginStyles.form}>
          <Field
            label="Correo electrónico"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            testID="login_email_input"
            leadingIcon="mail-outline"
            labelAccessory={<Text style={loginStyles.required}>Requerido</Text>}
            style={loginStyles.input}
          />
          <Field
            label="Contraseña"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            testID="login_password_input"
            leadingIcon="lock-closed-outline"
            style={loginStyles.input}
            labelAccessory={
              <Button
                label="¿Olvidaste tu contraseña?"
                variant="ghost"
                style={loginStyles.forgot}
                textStyle={loginStyles.forgotText}
                testID="login_forgot_password"
                onPress={() =>
                  onForgotPassword
                    ? onForgotPassword()
                    : a.run(
                        () => {},
                        "Para recuperar el acceso, contacta a soporte@laundryfresh.com.",
                      )
                }
              />
            }
          />
          {a.feedback}
          <Button
            label="Iniciar sesión"
            icon="arrow-forward"
            disabled={!email.trim() || !password}
            busy={a.busy}
            testID="login_submit_button"
            style={loginStyles.submit}
            onPress={() => {
              void a.asyncRun(async () => {
                const hash = await passwordHash(password);
                await onLogin(email, hash, password);
              });
            }}
          />
          <View style={loginStyles.divider} />
          {notice}
        </Card>
        <LoginAccessOptions onRegister={onRegister} />
      </View>
    </Page>
  );
}
