const { pool } = require('../db/pool');

function clean(value = '') {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalize(value = '') {
  return clean(value).toLowerCase();
}

async function findRequestedFreelancer(text) {
  const value = normalize(text);
  if (!value) return null;

  const result = await pool.query(`
    SELECT id, display_name
      FROM staff
     WHERE status = 'active'
       AND scheduling_type = 'freelance'
     ORDER BY display_name, id
  `);

  for (const staff of result.rows) {
    const name = normalize(staff.display_name);
    if (name && value.includes(name)) return staff;
  }

  return null;
}

async function guardClientFreelancerBooking(text) {
  const value = normalize(text);
  if (!value) return { blocked: false };

  const bookingLanguage = /\b(book|booking|appointment|schedule|reserve|availability|available|with|therapist|practitioner)\b/i.test(value);
  if (!bookingLanguage) return { blocked: false };

  const requestedFreelancer = await findRequestedFreelancer(text);
  const genericFreelancerRequest = /\bfreelancer(s)?\b/i.test(value);

  if (!requestedFreelancer && !genericFreelancerRequest) return { blocked: false };

  return {
    blocked: true,
    staff: requestedFreelancer,
    reply: requestedFreelancer
      ? `${requestedFreelancer.display_name} is a freelance practitioner and is not available for direct client bookings. I can help you book with one of Shiloh's regular practitioners instead.`
      : `Freelance practitioners are not available for direct client bookings. I can help you book with one of Shiloh's regular practitioners instead.`,
  };
}

module.exports = {
  guardClientFreelancerBooking,
  findRequestedFreelancer,
};
