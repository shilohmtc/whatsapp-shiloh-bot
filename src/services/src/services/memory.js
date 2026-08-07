function addMessage(phone, role, content) {
  const history = getHistory(phone);

  history.push({
    role,
    content: content.trim(),
  });

  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
}
