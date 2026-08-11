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

test("server-renders the public Squirrel welcome page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Squirrel!<\/title>/i);
  assert.match(html, /Your brain has enough tabs open\./);
  assert.match(html, /Sign in to Squirrel/);
  assert.match(html, /Your acorns stay yours/);
  assert.doesNotMatch(html, /Demo Mode/);
});

test("server-renders the protected Squirrel dashboard for a signed-in user", async () => {
  const response = await render("/dashboard", {
    accept: "text/html",
    "oai-authenticated-user-id": "test-user",
    "oai-authenticated-user-email": "alex@example.com",
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Acorns first\. Side quest later\./);
  assert.match(html, /Because “I’ll remember” is how we got here\./);
  assert.match(html, /Squirrel this/);
  assert.match(html, /Do this next/);
  assert.match(html, /I’m stuck/);
  assert.match(html, /Acorn Pile/);
  assert.match(html, /Connect Google Calendar/);
  assert.match(html, /Coming Up/);
  assert.match(html, /Sidebox/);
  assert.match(html, /School stuff, minus the digital junk drawer\./);
  assert.match(html, /ADHD &amp; RSD Tips/);
  assert.doesNotMatch(html, /react-loading-skeleton|codex-preview|Your site is taking shape/i);
  assert.doesNotMatch(html, /Demo Mode/);
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

test("academic and profile APIs reject unsigned-in requests", async () => {
  for (const path of ["/api/academic", "/api/profile", "/api/acorns", "/api/academic/files/search?q=lecture"]) {
    const response = await render(path, { accept: "application/json" });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).code, "squirrel_sign_in_required");
  }
});
