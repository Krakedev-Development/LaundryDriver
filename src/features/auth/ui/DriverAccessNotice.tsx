import { Text } from "react-native";
import { loginStyles } from "../../../components/LoginPresentation";

export function DriverAccessNotice() {
  return (
    <Text style={loginStyles.accountNotice}>
      Tu cuenta de chofer es creada por administración. Contacta a tu
      administrador si necesitas acceso.
    </Text>
  );
}
