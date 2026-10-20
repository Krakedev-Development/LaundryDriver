import { LoginAccessOptions } from "./LoginAccessOptions";
import { useState } from "react";
import { Text, View } from "react-native";
import { Page } from "../../../components/Page";
import { Body, Button, Card, Field, useAction } from "../../../components/ui";
import { LoginBrand, loginStyles } from "../../../components/LoginPresentation";
import { passwordHash } from "../../../services/passwordHash";
export function LoginForm({
  initialEmail,
  demoLabel,
  onLogin,
  onDemo,
  onRegister,
}: {
  initialEmail: string;
  demoLabel: string;
  onLogin(email: string, hash: string): void;
  onDemo(): void;
  onRegister?: () => void;
}) {
  const a = useAction();
  const [email, setEmail] = useState(initialEmail),
    [password, setPassword] = useState("123456");
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
                onPress={() =>
                  a.run(
                    () => {},
                    "Para recuperar el acceso, contacta a soporte@laundryfresh.com. En esta demo no se envían correos.",
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
                onLogin(email, hash);
              });
            }}
          />
          <View style={loginStyles.divider} />
        </Card>
        <LoginAccessOptions
          demoLabel={demoLabel}
          onDemo={onDemo}
          onRegister={onRegister}
        />
      </View>
    </Page>
  );
}
