const crm = require("../services/crmReadService");
const availability = require("../services/availabilityService");

function ok(res, data, meta) { return res.json({ ok: true, data, ...(meta ? { meta } : {}) }); }
function fail(res, status, code, message) { return res.status(status).json({ ok: false, error: { code, message } }); }
function pagination(query) { return { limit: query.limit, offset: query.offset }; }
function validId(value) { return /^\d+$/.test(String(value)) && Number(value) > 0; }

async function listClients(req, res, next) {
  try { const data = await crm.listClients({ q: req.query.q, status: req.query.status, ...pagination(req.query) }); return ok(res, data, { count: data.length }); } catch (e) { next(e); }
}
async function getClient(req, res, next) {
  try { if (!validId(req.params.id)) return fail(res, 400, "INVALID_ID", "Client id must be a positive integer."); const data = await crm.getClient(req.params.id); return data ? ok(res, data) : fail(res, 404, "CLIENT_NOT_FOUND", "Client not found."); } catch (e) { next(e); }
}
async function getClientAppointments(req, res, next) {
  try { if (!validId(req.params.id)) return fail(res, 400, "INVALID_ID", "Client id must be a positive integer."); const client = await crm.getClient(req.params.id); if (!client) return fail(res, 404, "CLIENT_NOT_FOUND", "Client not found."); const data = await crm.getClientAppointments(req.params.id, pagination(req.query)); return ok(res, data, { count: data.length }); } catch (e) { next(e); }
}
async function listServices(req, res, next) {
  try { const data = await crm.listServices({ status: req.query.status, categoryId: req.query.categoryId, ...pagination(req.query) }); return ok(res, data, { count: data.length }); } catch (e) { next(e); }
}
async function listStaff(req, res, next) {
  try { const data = await crm.listStaff({ status: req.query.status, ...pagination(req.query) }); return ok(res, data, { count: data.length }); } catch (e) { next(e); }
}
async function listAppointments(req, res, next) {
  try { const data = await crm.listAppointments({ status: req.query.status, clientId: req.query.clientId, from: req.query.from, to: req.query.to, ...pagination(req.query) }); return ok(res, data, { count: data.length }); } catch (e) { next(e); }
}
async function getAppointment(req, res, next) {
  try { if (!validId(req.params.id)) return fail(res, 400, "INVALID_ID", "Appointment id must be a positive integer."); const data = await crm.getAppointment(req.params.id); return data ? ok(res, data) : fail(res, 404, "APPOINTMENT_NOT_FOUND", "Appointment not found."); } catch (e) { next(e); }
}
async function listAvailableSlots(req, res, next) {
  try {
    if (!validId(req.query.staffId) || !validId(req.query.serviceId)) return fail(res, 400, "INVALID_AVAILABILITY_REQUEST", "staffId and serviceId must be positive integers.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(req.query.date || ""))) return fail(res, 400, "INVALID_DATE", "date must use YYYY-MM-DD.");
    const data = await availability.listAvailableSlots({ staffId: req.query.staffId, serviceId: req.query.serviceId, date: req.query.date, locationId: req.query.locationId, intervalMinutes: req.query.intervalMinutes });
    if (data.status === "inactive_or_missing") return fail(res, 404, "RESOURCE_NOT_FOUND", "Active staff/service combination not found.");
    if (data.status === "not_eligible") return fail(res, 409, "STAFF_NOT_ELIGIBLE", "Staff member is not eligible for this service.");
    if (data.status === "invalid_duration") return fail(res, 409, "INVALID_SERVICE_DURATION", "Service does not have a usable duration.");
    return ok(res, data, { count: data.slots.length });
  } catch (e) { next(e); }
}

module.exports = { listClients, getClient, getClientAppointments, listServices, listStaff, listAppointments, getAppointment, listAvailableSlots };
