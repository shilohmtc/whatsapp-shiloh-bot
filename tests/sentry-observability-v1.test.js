const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createObservability,
  sanitizeSentryEvent,
} = require("../src/lib/observability");

function fakeLogger() {
  return { info() {}, warn() {} };
}

test("Sentry stays disabled and harmless when SENTRY_DSN is unset", async () => {
  let initialized = false;
  const sentry = {
    init() { initialized = true; },
    withScope() { throw new Error("must not capture"); },
    flush() { throw new Error("must not flush"); },
  };
  const observability = createObservability({ sentry, log: fakeLogger() });

  assert.equal(observability.initialize({}), false);
  assert.equal(observability.isEnabled(), false);
  assert.equal(observability.captureException(new Error("private message")), false);
  assert.equal(await observability.flush(), true);
  assert.equal(initialized, false);
});

test("Sentry initializes error monitoring with privacy-first defaults", () => {
  let config;
  const sentry = { init(value) { config = value; } };
  const observability = createObservability({ sentry, log: fakeLogger() });

  assert.equal(observability.initialize({
    SENTRY_DSN: "https://public@example.ingest.sentry.io/1",
    SENTRY_ENVIRONMENT: "production",
    RENDER_GIT_COMMIT: "abcdef123456",
  }), true);
  assert.equal(config.sendDefaultPii, false);
  assert.equal(config.tracesSampleRate, 0);
  assert.equal(config.maxBreadcrumbs, 0);
  assert.equal(config.environment, "production");
  assert.equal(config.release, "abcdef123456");
  assert.deepEqual(
    config.integrations([
      { name: "RequestData" },
      { name: "Http" },
      { name: "Console" },
      { name: "LocalVariables" },
      { name: "OnUncaughtException" },
      { name: "OnUnhandledRejection" },
    ]).map((integration) => integration.name),
    ["OnUncaughtException", "OnUnhandledRejection"]
  );
});

test("Sentry initialization failure cannot prevent application startup", () => {
  const warnings = [];
  const observability = createObservability({
    sentry: { init() { throw new Error("invalid DSN containing a secret"); } },
    log: { info() {}, warn(message) { warnings.push(message); } },
  });

  assert.equal(observability.initialize({ SENTRY_DSN: "invalid-secret-dsn" }), false);
  assert.equal(observability.isEnabled(), false);
  assert.deepEqual(warnings, ["Sentry disabled because initialization failed"]);
  assert.equal(JSON.stringify(warnings).includes("invalid-secret-dsn"), false);
});

test("Sentry sanitizer removes clinic, client, request, provider, and secret data", () => {
  const sensitive = "Client Jane +27821234567 says shoulder pain; token EAA-secret";
  const sanitized = sanitizeSentryEvent({
    event_id: "event-id",
    timestamp: 123,
    environment: "production",
    release: "abcdef123456",
    message: sensitive,
    transaction: "/clients/Jane",
    request: {
      url: "/webhook?phone=+27821234567",
      headers: { authorization: "Bearer secret" },
      data: { body: sensitive },
      cookies: { session: "secret" },
    },
    user: { id: "+27821234567", username: "Jane" },
    extra: { appointmentNotes: sensitive, providerPayload: { token: "secret" } },
    contexts: { client: { name: "Jane" } },
    breadcrumbs: [{ message: sensitive, data: { phone: "+27821234567" } }],
    tags: {
      "error.kind": "express",
      "error.code": "23505",
      "http.method": "POST",
      "http.route": "/webhook",
      clientName: "Jane",
    },
    exception: {
      values: [{
        type: "ProviderError",
        value: sensitive,
        mechanism: { type: "generic", handled: true, data: { providerPayload: sensitive } },
        stacktrace: {
          frames: [{
            filename: "C:\\Users\\private-user\\app\\src\\routes\\webhook.js",
            abs_path: "C:\\Users\\private-user\\app\\src\\routes\\webhook.js",
            function: "handleWebhook",
            lineno: 42,
            colno: 7,
            context_line: sensitive,
            pre_context: [sensitive],
            vars: { clientName: "Jane" },
          }],
        },
      }],
    },
  });

  const serialized = JSON.stringify(sanitized);
  for (const forbidden of ["Jane", "+27821234567", "shoulder pain", "EAA-secret", "Bearer secret", "private-user"] ) {
    assert.equal(serialized.includes(forbidden), false, `must remove ${forbidden}`);
  }
  assert.equal(sanitized.exception.values[0].value, "Unhandled application error");
  assert.deepEqual(sanitized.tags, {
    "error.kind": "express",
    "error.code": "23505",
    "http.method": "POST",
    "http.route": "/webhook",
  });
  assert.deepEqual(sanitized.exception.values[0].stacktrace.frames[0], {
    filename: "src/routes/webhook.js",
    function: "handleWebhook",
    module: undefined,
    lineno: 42,
    colno: 7,
    in_app: undefined,
  });
});

test("capture sends only allowlisted context and never changes application flow", () => {
  const tags = {};
  let captured;
  const scope = {
    clearBreadcrumbs() {},
    setUser(value) { assert.equal(value, null); },
    setTag(key, value) { tags[key] = value; },
  };
  const sentry = {
    init() {},
    withScope(callback) { callback(scope); },
    captureException(error) { captured = error; },
  };
  const observability = createObservability({ sentry, log: fakeLogger() });
  observability.initialize({ SENTRY_DSN: "https://public@example.ingest.sentry.io/1" });
  const error = new Error("raw WhatsApp message body");

  assert.equal(observability.captureException(error, {
    "error.kind": "express",
    "http.method": "POST",
    "http.route": "/webhook",
    clientName: "Jane",
  }), true);
  assert.equal(captured, error);
  assert.deepEqual(tags, {
    "error.kind": "express",
    "http.method": "POST",
    "http.route": "/webhook",
  });
});
