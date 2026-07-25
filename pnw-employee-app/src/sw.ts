/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";
import { resolveNotificationLink } from "./lib/linkFallback";

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

interface PushPayload {
  title?: string;
  body?: string;
  link?: string | null;
}

self.addEventListener("push", (event) => {
  let payload: PushPayload = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = { body: event.data?.text() };
  }

  const title = payload.title ?? "PNW Fitness";
  const link = resolveNotificationLink(payload.link);

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body ?? "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { link },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data?.link as string | undefined) ?? "/schedule";

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientsList) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) await (client as WindowClient).navigate(link);
          return;
        }
      }
      await self.clients.openWindow(link);
    })(),
  );
});
