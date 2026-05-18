self.addEventListener("push", (event) => {
  let data = { title: "PRoof", body: "Workout reminder" };
  try {
    data = event.data?.json() ?? data;
  } catch {
    /* ignore */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/today"));
});
