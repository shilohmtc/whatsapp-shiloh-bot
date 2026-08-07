const conversations = new Map();

const MAX_HISTORY = 20;

function getHistory(phone) {
  if (!conversations.has(phone)) {
    conversations.set(phone, []);
  }

  return conversations.get(phone);
}

function addMessage(phone, role, content) {
  const history = getHistory(phone);

  history.push({
    role,
    content,
  });

  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
}

function clearHistory(phone) {
  conversations.delete(phone);
}

module.exports = {
  getHistory,
  addMessage,
  clearHistory,
};
