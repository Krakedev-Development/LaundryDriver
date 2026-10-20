import {
  CommonActions,
  StackActions,
  useNavigation,
  type NavigationProp,
} from "@react-navigation/native";
import { primaryTabTarget } from "./primaryTabs";
import type { RootRoutes, Routes } from "./routes";

type Options = { merge?: boolean; pop?: boolean };
type Arguments<T extends keyof Routes> = T extends unknown
  ? undefined extends Routes[T]
    ? [name: T, params?: Routes[T], options?: Options]
    : [name: T, params: Routes[T], options?: Options]
  : never;

export function useLaundryNavigation() {
  const navigation = useNavigation<NavigationProp<RootRoutes>>();

  function navigate<T extends keyof Routes>(...args: Arguments<T>) {
    const [name, params, options] = args;
    const primary = primaryTabTarget(name);
    if (primary) {
      // Return to the existing tab navigator; keep its mounted screens and state.
      navigation.dispatch(
        CommonActions.navigate(
          primary.name,
          { screen: primary.screen },
          { pop: true, merge: true },
        ),
      );
    } else {
      // Reuse an existing destination instead of piling up copies of that screen.
      navigation.dispatch(
        CommonActions.navigate(name, params, { pop: true, ...options }),
      );
    }
  }
  function replace<T extends keyof Routes>(...args: Arguments<T>) {
    const [name, params] = args;
    if (primaryTabTarget(name)) {
      navigate(...args);
    } else {
      navigation.dispatch(StackActions.replace(name, params));
    }
  }
  function popTo<T extends keyof Routes>(...args: Arguments<T>) {
    const [name, params, options] = args;
    if (primaryTabTarget(name)) {
      navigate(...args);
    } else {
      navigation.dispatch(
        StackActions.popTo(name, params, { merge: options?.merge }),
      );
    }
  }
  return {
    navigate,
    replace,
    popTo,
    goBack: navigation.goBack,
    canGoBack: navigation.canGoBack,
  };
}
