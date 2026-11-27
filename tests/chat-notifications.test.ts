import assert from "node:assert/strict";
import test from "node:test";
import {
  chatRoleLabel,
  chatService,
  mergeChatMessages,
  type ServerChatMessage,
} from "../src/services/chat/chatService";
import { notificationsService } from "../src/services/notifications/notificationsService";

test("driver chatService merges messages and calls /orders/:id/messages", async () => {
  const m2: ServerChatMessage = {
    id: "m2",
    orderId: "ord-d1",
    senderId: "u-client",
    senderName: "Lucia",
    senderRole: "CLIENT",
    text: "Gracias",
    createdAt: "2026-11-27T12:10:00.000Z",
  };
  const m1: ServerChatMessage = {
    id: "m1",
    orderId: "ord-d1",
    senderId: "u-sup",
    senderName: "Soporte",
    senderRole: "SUPERVISOR",
    text: "Recogida asignada",
    createdAt: "2026-11-27T12:00:00.000Z",
  };

  assert.deepEqual(
    mergeChatMessages([m2], [m1, m2]).map((m) => m.id),
    ["m1", "m2"],
  );
  assert.equal(chatRoleLabel("CLIENT"), "Cliente");

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
    if (init?.method === "POST") {
      return new Response(JSON.stringify(m1), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify([m1, m2]), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  try {
    const msgs = await chatService.listOrderMessages("ord-d1", {
      accessToken: "drv-tok",
    });
    assert.equal(msgs.length, 2);
    const sent = await chatService.sendOrderMessage(
      "ord-d1",
      " En camino ",
      "drv-tok",
    );
    assert.equal(sent.id, "m1");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("driver notificationsService registers and unregisters Expo device token", async () => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    requests.push(`${init?.method ?? "GET"} ${url}`);
    if (init?.method === "DELETE") {
      return new Response(JSON.stringify({ unregistered: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({
        id: "dev-drv-1",
        token: "ExponentPushToken[drv-1]",
        active: true,
      }),
      { status: 201, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const reg = await notificationsService.registerDeviceToken(
      {
        token: "ExponentPushToken[drv-1]",
        platform: "ANDROID",
        appType: "DRIVER",
      },
      "drv-tok",
    );
    assert.equal(reg.active, true);
    const unreg = await notificationsService.unregisterDeviceToken(
      "ExponentPushToken[drv-1]",
      "drv-tok",
    );
    assert.equal(unreg.unregistered, true);
    assert.ok(requests[0]?.startsWith("POST "));
    assert.ok(requests[1]?.startsWith("DELETE "));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
