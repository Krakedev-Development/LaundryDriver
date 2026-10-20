import { useReducedMotion } from "../design-system/MotionProvider";
import { contentColors as colors } from "../components/ui";
import { useRef, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { Page } from "../components/Page";
import { Body, Button, Empty, Field, Title, useAction } from "../components/ui";
import { useApp } from "../store/AppProvider";
import { visibleOrders } from "../domain/repository";
import type { ScreenProps } from "../navigation/routes";
export function ChatScreen({ route }: ScreenProps<"Chat">) {
  const { state, execute } = useApp();
  const o = visibleOrders(state).find((o) => o.id === route.params.orderId);
  const a = useAction();
  const [text, setText] = useState("");
  const list = useRef<FlatList>(null),
    reduced = useReducedMotion();
  if (!o)
    return (
      <Page>
        <Empty text="Chat no disponible para esta solicitud." />
      </Page>
    );
  const messages = state.chatMessages[o.id] ?? [];
  const recipient = o.customerName;
  return (
    <Page scroll={false}>
      <View>
        <Title>{recipient ?? "Chat de solicitud"}</Title>
        <Body muted>{o.id} · Mensajes locales de demostración</Body>
      </View>
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
                {mine ? "Tú" : msg.senderName}
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
                {msg.timestamp}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Body muted>Inicia una conversación sobre este pedido.</Body>
        }
      />
      {a.feedback}
      <Field
        label="Escribe un mensaje"
        value={text}
        onChangeText={setText}
        multiline
        maxLength={2000}
      />
      <Button
        label="Enviar mensaje"
        icon="send-outline"
        disabled={!text.trim()}
        onPress={() => {
          if (a.run(() => execute((r) => r.sendChatMessage(o.id, text))))
            setText("");
        }}
      />
    </Page>
  );
}
