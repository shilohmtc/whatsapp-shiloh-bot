const crypto = require("crypto");

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const SCOPE = "https://www.googleapis.com/auth/calendar";
const DEFAULT_TIMEZONE = "Africa/Johannesburg";

let cachedToken = null;
let cachedTokenExpiresAt = 0;

function calendarEnabled() {
  return String(process.env.GOOGLE_CALENDAR_ENABLED || "").toLowerCase() === "true";
}

function authMode() {
  return String(process.env.GOOGLE_CALENDAR_AUTH_MODE || "service_account").trim().toLowerCase();
}

function requireCalendarConfig() {
  const calendarId = process.env.GOOGLE_BOOKING_CALENDAR_ID;
  if (!calendarId) {
    throw new Error("Google Calendar is enabled but GOOGLE_BOOKING_CALENDAR_ID is missing.");
  }
  return { calendarId };
}

function requireServiceAccountConfig() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = String(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) {
    throw new Error("GOOGLE_CALENDAR_AUTH_MODE=service_account requires GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.");
  }
  return { clientEmail, privateKey };
}

function requireOAuthConfig() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("GOOGLE_CALENDAR_AUTH_MODE=oauth_refresh_token requires GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REFRESH_TOKEN.");
  }
  return { clientId, clientSecret, refreshToken };
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function normalizeName(value = "") {
  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
}

async function getServiceAccountAccessToken() {
  const { clientEmail, privateKey } = requireServiceAccountConfig();
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    iss: clientEmail,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(unsigned), privateKey).toString("base64url");
  const assertion = `${unsigned}.${signature}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google service-account token request failed (${response.status}): ${detail.slice(0, 500)}`);
  }
  return response.json();
}

async function getOAuthRefreshAccessToken() {
  const { clientId, clientSecret, refreshToken } = requireOAuthConfig();
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google OAuth refresh-token request failed (${response.status}): ${detail.slice(0, 500)}`);
  }
  return response.json();
}

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedTokenExpiresAt - 60_000) return cachedToken;

  const mode = authMode();
  let token;
  if (mode === "oauth_refresh_token") {
    token = await getOAuthRefreshAccessToken();
  } else if (mode === "service_account") {
    token = await getServiceAccountAccessToken();
  } else {
    throw new Error(`Unsupported GOOGLE_CALENDAR_AUTH_MODE: ${mode}`);
  }

  cachedToken = token.access_token;
  cachedTokenExpiresAt = Date.now() + Number(token.expires_in || 3600) * 1000;
  return cachedToken;
}

async function googleRequest(path, options = {}) {
  requireCalendarConfig();
  const token = await getAccessToken();
  const response = await fetch(`${CALENDAR_API}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) return null;
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch (_) { body = text; }

  if (!response.ok) {
    const error = new Error(`Google Calendar API request failed (${response.status})`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

function deterministicEventId(idempotencyKey) {
  return crypto.createHash("sha256").update(String(idempotencyKey)).digest("hex").slice(0, 40);
}

function eventAppliesToStaff(event, staffName) {
  if (!staffName) return true;
  const requested = normalizeName(staffName);
  const taggedStaff = normalizeName(event.extendedProperties?.private?.shilohStaffName || "");
  if (taggedStaff) return taggedStaff === requested;

  const searchable = normalizeName(`${event.summary || ""} ${event.description || ""}`);
  if (searchable.includes(requested)) return true;

  // A busy event with no identifiable practitioner is treated as a clinic-wide block.
  return !/\bstaff\s*:/i.test(String(event.description || ""));
}

async function checkCalendarAvailability({ startsAt, endsAt, staffName = null, ignoreEventId = null }) {
  if (!calendarEnabled()) return { enabled: false, available: true, conflicts: [] };
  const { calendarId } = requireCalendarConfig();
  const query = new URLSearchParams({
    timeMin: new Date(startsAt).toISOString(),
    timeMax: new Date(endsAt).toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    showDeleted: "false",
    maxResults: "50",
  });
  const result = await googleRequest(`/calendars/${encodeURIComponent(calendarId)}/events?${query.toString()}`);
  const conflicts = (result.items || []).filter((event) => {
    if (ignoreEventId && event.id === ignoreEventId) return false;
    if (event.status === "cancelled" || event.transparency === "transparent") return false;
    if (!eventAppliesToStaff(event, staffName)) return false;
    const start = event.start?.dateTime || event.start?.date;
    const end = event.end?.dateTime || event.end?.date;
    if (!start || !end) return false;
    return new Date(start) < new Date(endsAt) && new Date(end) > new Date(startsAt);
  });

  return { enabled: true, available: conflicts.length === 0, conflicts };
}

async function createBookingEvent({ appointmentId, clientName, serviceName, staffName, locationName, startsAt, endsAt, source = "shiloh" }) {
  if (!calendarEnabled()) return { enabled: false, event: null };
  const { calendarId } = requireCalendarConfig();
  const eventId = deterministicEventId(`shiloh-appointment:${appointmentId}`);
  const body = {
    id: eventId,
    summary: `${clientName || "Client"} — ${serviceName || "Booking"}${staffName ? ` — ${staffName}` : ""}`,
    description: [
      `Shiloh CRM appointment #${appointmentId}`,
      staffName ? `Staff: ${staffName}` : null,
      locationName ? `Location: ${locationName}` : null,
      `Source: ${source}`,
    ].filter(Boolean).join("\n"),
    start: { dateTime: new Date(startsAt).toISOString(), timeZone: DEFAULT_TIMEZONE },
    end: { dateTime: new Date(endsAt).toISOString(), timeZone: DEFAULT_TIMEZONE },
    extendedProperties: {
      private: {
        shilohAppointmentId: String(appointmentId),
        shilohSource: String(source),
        ...(staffName ? { shilohStaffName: String(staffName) } : {}),
      },
    },
  };

  try {
    const event = await googleRequest(`/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return { enabled: true, event };
  } catch (error) {
    if (error.status !== 409) throw error;
    const event = await getBookingEvent(eventId);
    return { enabled: true, event, idempotentReplay: true };
  }
}

async function getBookingEvent(eventId) {
  if (!calendarEnabled()) return null;
  const { calendarId } = requireCalendarConfig();
  try {
    return await googleRequest(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`);
  } catch (error) {
    if (error.status === 404 || error.status === 410) return null;
    throw error;
  }
}

async function findBookingEventByAppointmentId(appointmentId) {
  if (!calendarEnabled()) return null;
  const { calendarId } = requireCalendarConfig();
  const query = new URLSearchParams({
    privateExtendedProperty: `shilohAppointmentId=${appointmentId}`,
    singleEvents: "true",
    showDeleted: "false",
    maxResults: "10",
  });
  const result = await googleRequest(`/calendars/${encodeURIComponent(calendarId)}/events?${query.toString()}`);
  return (result.items || [])[0] || null;
}

async function updateBookingEvent({ eventId, startsAt, endsAt, clientName, serviceName, staffName, locationName }) {
  if (!calendarEnabled()) return { enabled: false, event: null };
  const { calendarId } = requireCalendarConfig();
  const patch = {};
  if (clientName || serviceName || staffName) patch.summary = `${clientName || "Client"} — ${serviceName || "Booking"}${staffName ? ` — ${staffName}` : ""}`;
  if (startsAt) patch.start = { dateTime: new Date(startsAt).toISOString(), timeZone: DEFAULT_TIMEZONE };
  if (endsAt) patch.end = { dateTime: new Date(endsAt).toISOString(), timeZone: DEFAULT_TIMEZONE };
  if (staffName || locationName) patch.description = [staffName ? `Staff: ${staffName}` : null, locationName ? `Location: ${locationName}` : null].filter(Boolean).join("\n");
  if (staffName) patch.extendedProperties = { private: { shilohStaffName: String(staffName) } };

  const event = await googleRequest(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return { enabled: true, event };
}

async function cancelBookingEvent(eventId) {
  if (!calendarEnabled()) return { enabled: false, cancelled: false };
  const { calendarId } = requireCalendarConfig();
  try {
    await googleRequest(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, { method: "DELETE" });
    return { enabled: true, cancelled: true };
  } catch (error) {
    if (error.status === 404 || error.status === 410) return { enabled: true, cancelled: true, alreadyMissing: true };
    throw error;
  }
}

module.exports = {
  calendarEnabled,
  authMode,
  checkCalendarAvailability,
  createBookingEvent,
  getBookingEvent,
  findBookingEventByAppointmentId,
  updateBookingEvent,
  cancelBookingEvent,
  deterministicEventId,
};
