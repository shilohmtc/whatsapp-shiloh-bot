const crm = require("../services/crmReadService");
const availability = require("../services/availabilityService");
const staffSchedule = require("../services/staffScheduleService");

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
async function getStaffWorkingHours(req, res, next) {
  try {
    if (!validId(req.params.id)) return fail(res, 400, "INVALID_ID", "Staff id must be a positive integer.");
    const data = await staffSchedule.getWorkingHours(req.params.id);
    return data ? ok(res, data) : fail(res, 404, "STAFF_NOT_FOUND", "Staff member not found.");
  } catch (e) { next(e); }
}
async function replaceStaffWorkingHoursDay(req, res, next) {
  try {
    if (!validId(req.params.id)) return fail(res, 400, "INVALID_ID", "Staff id must be a positive integer.");
    const result = await staffSchedule.replaceWorkingHoursDay({ staffId: req.params.id, dayOfWeek: req.params.day, windows: req.body?.windows || [], locationId: req.body?.locationId || null });
    if (result.status !== "updated") return fail(res, 400, "SCHEDULE_UPDATE_REJECTED", result.reply || "Working-hours update rejected.");
    return ok(res, result);
  } catch (e) { next(e); }
}
async function addStaffScheduleException(req, res, next) {
  try {
    if (!validId(req.params.id)) return fail(res, 400, "INVALID_ID", "Staff id must be a positive integer.");
    const result = await staffSchedule.addScheduleException({ staffId: req.params.id, date: req.body?.date, type: req.body?.type, startsLocal: req.body?.startsLocal || null, endsLocal: req.body?.endsLocal || null, reason: req.body?.reason || null, locationId: req.body?.locationId || null });
    if (result.status !== "created") return fail(res, 400, "SCHEDULE_EXCEPTION_REJECTED", result.reply || "Schedule exception rejected.");
    return ok(res, result);
  } catch (e) { next(e); }
}
async function removeStaffScheduleException(req, res, next) {
  try {
    if (!validId(req.params.id) || !validId(req.params.exceptionId)) return fail(res, 400, "INVALID_ID", "Staff and exception ids must be positive integers.");
    const result = await staffSchedule.removeScheduleException({ staffId: req.params.id, exceptionId: req.params.exceptionId });
    return result.status === "removed" ? ok(res, result) : fail(res, 404, "EXCEPTION_NOT_FOUND", "Schedule exception not found.");
  } catch (e) { next(e); }
}

module.exports = { listClients, getClient, getClientAppointments, listServices, listStaff, listAppointments, getAppointment, listAvailableSlots, getStaffWorkingHours, replaceStaffWorkingHoursDay, addStaffScheduleException, removeStaffScheduleException };
