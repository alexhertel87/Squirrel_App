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
  assert.match(html, /See one clear next step at a time\./);
  assert.match(html, /Squirrel! is a free web app/);
  assert.match(html, /Keep the exact medication type and dose together\./);
  assert.match(html, /Designed to make planning, starting, and finishing tasks easier\./);
  assert.match(html, /Let Squirrel! remember the details and show you what comes next\./);
  assert.match(html, /Sign in to Squirrel/);
  assert.match(html, /Your information stays private to your account/);
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
  assert.match(html, /Choose one clear next step\./);
  assert.match(html, /Save tasks and reminders before you forget them\./);
  assert.match(html, /Tasks, schedules, medications, classes, files, and reminders in one place\./);
  assert.match(html, /Quick Capture/);
  assert.match(html, /Save To Inbox/);
  assert.match(html, /Save first and organize later\./);
  assert.match(html, /Recommended Next Task/);
  assert.match(html, /Starts a 25-minute timer and hides other dashboard items\./);
  assert.match(html, /Current Recommendation/);
  assert.match(html, /Assignments and events that need attention/);
  assert.match(html, /I’m Stuck/);
  assert.match(html, /Task Inbox/);
  assert.match(html, /Low-Energy Day/);
  assert.match(html, /Plan For Today/);
  assert.match(html, /Connect Google Calendar/);
  assert.match(html, /Add or change plans/);
  assert.match(html, /Manage Google Calendar events/);
  assert.doesNotMatch(html, /Schedule &amp; Deadlines|Due Dates &amp; Deadlines/);
  assert.match(html, /Quick View/);
  assert.match(html, /Keep courses, assignments, and lecture files together\./);
  assert.match(html, /ADHD &amp; Rejection Sensitivity Tips/);
  assert.doesNotMatch(html, /react-loading-skeleton|codex-preview|Your site is taking shape/i);
  assert.doesNotMatch(html, /Demo Mode/);
  const visibleText = html.replace(/<[^>]+>/g, " ");
  assert.doesNotMatch(visibleText, /Minimum Viable Day|Acorn Pile|one-acorn engine|next-acorn suggestion|Squirrel! Mode|Sidebox/i);
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

test("private app APIs reject unsigned-in requests", async () => {
  for (const path of ["/api/academic", "/api/profile", "/api/acorns", "/api/acorns/suggest", "/api/calibration", "/api/medications", "/api/insights", "/api/search?q=lecture", "/api/privacy/export", "/api/academic/files/search?q=lecture", "/api/academic/syllabus-suggestions"]) {
    const response = await render(path, { accept: "application/json" });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).code, "squirrel_sign_in_required");
  }
});
