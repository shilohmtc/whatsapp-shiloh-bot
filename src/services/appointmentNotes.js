const MAX_APPOINTMENT_NOTES_LENGTH = 4000;

class AppointmentNotesError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AppointmentNotesError';
    this.code = code;
    this.httpStatus = 400;
  }
}

function normalizeAppointmentNotes(value) {
  const notes = String(value || '').trim();
  if (notes.length > MAX_APPOINTMENT_NOTES_LENGTH) {
    throw new AppointmentNotesError(
      'APPOINTMENT_NOTES_TOO_LONG',
      `Appointment notes must be ${MAX_APPOINTMENT_NOTES_LENGTH} characters or fewer.`
    );
  }
  return notes || null;
}

module.exports = {
  MAX_APPOINTMENT_NOTES_LENGTH,
  AppointmentNotesError,
  normalizeAppointmentNotes,
};
