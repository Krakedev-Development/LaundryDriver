import { useReducedMotion } from "../design-system/MotionProvider";
import { contentColors as colors } from "../components/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { Page } from "../components/Page";
import { Body, Button, Empty, Field, Title } from "../components/ui";
import { useApp } from "../store/AppProvider";
import { visibleOrders } from "../domain/repository";
import type { ScreenProps } from "../navigation/routes";
import {
  chatRoleLabel,
  chatService,
  type ServerChatMessage,
} from "../services/chat/chatService";
import { driverSocketService } from "../services/realtime/driverSocketService";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ChatScreen({ route }: ScreenProps<"Chat">) {
  const { state } = useApp();
  const routeOrderId = route.params.orderId;
  const o = visibleOrders(state).find((item) => item.id === routeOrderId);
  const apiOrderId = UUID_RE.test(routeOrderId)
    ? routeOrderId
    : o && UUID_RE.test(o.id)
      ? o.id
      : null;

  const [messages, setMessages] = useState<ServerChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const list = useRef<FlatList>(null);
  const reduced = useReducedMotion();

  const isClosed = o?.status === "COMPLETED" || o?.status === "CANCELLED";

  const loadHistory = useCallback(async () => {
    if (!apiOrderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await chatService.listOrderMessages(apiOrderId);
      setMessages((prev) => chatService.mergeChatMessages(prev, rows));
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "No se pudieron cargar los mensajes.",
      );
    } finally {
      setLoading(false);
    }
  }, [apiOrderId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!apiOrderId) return;
    void driverSocketService.connect();
    driverSocketService.subscribeOrder(apiOrderId);

    const onAuthenticated = () => {
      driverSocketService.subscribeOrder(apiOrderId);
      void loadHistory();
    };
    const onNewMessage = (raw: unknown) => {
      const incoming = raw as ServerChatMessage | null;
      if (!incoming || incoming.orderId !== apiOrderId) return;
      setMessages((prev) => chatService.mergeChatMessages(prev, [incoming]));
    };

    driverSocketService.on("authenticated", onAuthenticated);
    driverSocketService.on("chat:message:new", onNewMessage);
    return () => {
      driverSocketService.off("authenticated", onAuthenticated);
      driverSocketService.off("chat:message:new", onNewMessage);
      driverSocketService.unsubscribeOrder(apiOrderId);
    };
  }, [apiOrderId, loadHistory]);

  if (!apiOrderId) {
    return (
      <Page>
        <Empty text="Chat no disponible para esta solicitud." />
      </Page>
    );
  }

  const recipient = o?.customerName
    ? `${o.customerName} · Cliente y Soporte`
    : "Chat del pedido (Cliente y Soporte)";
  const displayCode = o?.id ? o.id.slice(0, 8) : apiOrderId.slice(0, 8);

  const handleSend = async () => {
    const clean = text.trim();
    if (!clean || sending || isClosed) return;
    setSending(true);
    setError(null);
    try {
      const created = await chatService.sendOrderMessage(apiOrderId, clean);
      setMessages((prev) => chatService.mergeChatMessages(prev, [created]));
      setText("");
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "No se pudo enviar el mensaje.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Page scroll={false}>
      <View>
        <Title>{recipient}</Title>
        <Body muted>{displayCode} · En tiempo real</Body>
      </View>
      {error ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <Body style={{ color: "#B91C1C", flex: 1, fontSize: 12 }}>{error}</Body>
          <Button
            label="Reintentar"
            secondary
            variant="ghost"
            onPress={() => void loadHistory()}
          />
        </View>
      ) : null}
      <FlatList
        ref={list}
        style={{ flex: 1 }}
        data={messages}
        keyExtractor={(msg) => msg.id}
        contentContainerStyle={{ gap: 10, paddingVertical: 10 }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          list.current?.scrollToEnd({ animated: !reduced })
        }
        renderItem={({ item: msg }) => {
          const mine = msg.senderId === state.session?.id;
          const timeLabel = new Date(msg.createdAt).toLocaleTimeString("es-EC", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return (
            <View
              key={msg.id}
              style={{
                alignSelf: mine ? "flex-end" : "flex-start",
                maxWidth: "88%",
                padding: 13,
                borderRadius: 12,
                backgroundColor: mine ? colors.primary : colors.soft,
                gap: 5,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: mine ? colors.soft : colors.muted,
                }}
              >
                {mine
                  ? "Tú"
                  : `${msg.senderName} (${chatRoleLabel(msg.senderRole)})`}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  lineHeight: 22,
                  color: mine ? colors.onPrimary : colors.text,
                }}
              >
                {msg.text}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  color: mine ? colors.soft : colors.muted,
                }}
              >
                {timeLabel}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Body muted>
            {loading
              ? "Cargando mensajes del servidor..."
              : "Inicia una conversación sobre este pedido."}
          </Body>
        }
      />
      {isClosed ? (
        <Body muted>
          Este pedido está cerrado; ya no admite nuevos mensajes.
        </Body>
      ) : (
        <>
          <Field
            label="Escribe un mensaje"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <Button
            label={sending ? "Enviando..." : "Enviar mensaje"}
            icon="send-outline"
            disabled={sending || !text.trim()}
            onPress={() => void handleSend()}
          />
        </>
      )}
    </Page>
  );
}
