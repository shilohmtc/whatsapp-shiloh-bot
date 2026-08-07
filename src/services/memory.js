const sessions = new Map();

function getSession(phone) {
  return sessions.get(phone);
}

function saveSession(phone, responseId) {
  sessions.set(phone, responseId);
}

function clearSession(phone) {
  sessions.delete(phone);
}

module.exports = {
  getSession,
  saveSession,
  clearSession,
};
