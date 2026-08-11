import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/", headers = { accept: "text/html" }) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers,
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Squirrel dashboard shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Squirrel! Dashboard<\/title>/i);
  assert.match(html, /Start with the next kind thing\./);
  assert.match(html, /Connect Google Calendar/);
  assert.match(html, /Coming Up/);
  assert.match(html, /Sidebox/);
  assert.match(html, /One calm home for classes, documents, and deadlines\./);
  assert.doesNotMatch(html, /react-loading-skeleton|codex-preview|Your site is taking shape/i);
});

test("calendar status stays safely unavailable until Google credentials are configured", async () => {
  const response = await render("/api/calendar/status", {
    accept: "application/json",
    "oai-authenticated-user-id": "test-user",
    "oai-authenticated-user-email": "alex@example.com",
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    configured: false,
    connected: false,
    scope: "https://www.googleapis.com/auth/calendar.events.owned",
  });
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("calendar API rejects an unsigned-in request", async () => {
  const response = await render("/api/calendar/status", {
    accept: "application/json",
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).code, "squirrel_sign_in_required");
});
