import { LoginForm } from "../../features/auth/ui/LoginForm";
import { useApp } from "../../store/AppProvider";

export function LoginScreen() {
  const { execute } = useApp();
  return (
    <LoginForm
      initialEmail="carlos.mendoza@laundryfresh.com"
      demoLabel="Chofer demo"
      onLogin={(email, hash) => execute((repo) => repo.login(email, hash))}
      onDemo={() => execute((repo) => repo.demoLogin("DRIVER"))}
    />
  );
}
