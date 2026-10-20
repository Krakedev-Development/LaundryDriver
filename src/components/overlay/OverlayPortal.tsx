import { useIsFocused } from "@react-navigation/native";
import { useContext, useEffect, useId, useLayoutEffect } from "react";
import { OverlayContext, type OverlayEntry } from "./OverlayContext";
type Props = Omit<OverlayEntry, "id" | "kind"> & { visible: boolean };
function Portal({
  visible,
  kind,
  ...entry
}: Props & { kind: OverlayEntry["kind"] }) {
  const context = useContext(OverlayContext);
  const id = useId(),
    focused = useIsFocused();
  useEffect(() => {
    if (visible && !focused) entry.onClose();
  }, [focused, visible, entry.onClose]);
  if (!context) throw Error("OverlayProvider no está disponible.");
  const { present, dismiss } = context;
  useLayoutEffect(() => {
    if (visible && focused) present({ ...entry, id, kind });
    else dismiss(id);
  }, [
    visible,
    focused,
    id,
    kind,
    entry.title,
    entry.children,
    entry.footer,
    entry.onClose,
    entry.dismissible,
    present,
    dismiss,
  ]);
  useEffect(() => () => dismiss(id), [dismiss, id]);
  return null;
}
export function BottomSheet(props: Props) {
  return <Portal {...props} kind="sheet" />;
}
export function ConfirmDialog(props: Props) {
  return <Portal {...props} kind="dialog" dismissible={false} />;
}
export function Drawer(props: Props) {
  return <Portal {...props} kind="drawer" />;
}
export function FullScreenOverlay(props: Props) {
  return <Portal {...props} kind="full" />;
}
