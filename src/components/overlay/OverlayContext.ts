import { createContext, useContext, type ReactNode } from "react";
export type OverlayKind = "sheet" | "dialog" | "drawer" | "full";
export type OverlayEntry = {
  id: string;
  kind: OverlayKind;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose(): void;
  dismissible?: boolean;
};
export type FeedbackKind = "success" | "info" | "warning";
export const OverlayContext = createContext<{
  present(entry: OverlayEntry): void;
  dismiss(id: string): void;
  notify(message: string, kind?: FeedbackKind): void;
} | null>(null);
export function useFeedback() {
  return useContext(OverlayContext)?.notify;
}
