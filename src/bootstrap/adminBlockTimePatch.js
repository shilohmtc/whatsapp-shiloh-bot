// Retained as a startup-compatible no-op. Block Time now belongs to Shiloh
// Calendar and must not be injected back into the ordinary WhatsApp router.
function enrichAppointments(result) { return result; }

module.exports = { enrichAppointments };
