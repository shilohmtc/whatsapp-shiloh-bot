const {
  WHATSAPP_LIST_LIMITS,
  cleanListText,
  truncateListText,
} = require('./whatsappListRowPresentation');

const WHATSAPP_REPLY_BUTTON_LIMITS = Object.freeze({
  body: 1024,
  count: 3,
  id: 256,
  title: WHATSAPP_LIST_LIMITS.buttonTitle,
});

function cleanChoiceId(value = '') {
  return String(value || '').trim();
}

function buttonTitle(value = '') {
  return truncateListText(value, WHATSAPP_REPLY_BUTTON_LIMITS.title);
}

function listRows(interactive = {}) {
  if (Array.isArray(interactive.rows)) return interactive.rows;
  return interactive.sections?.[0]?.rows || [];
}

function choiceDetailLine(row = {}) {
  const title = cleanListText(row.title);
  const description = cleanListText(row.description);
  if (!description || description === title) return `• ${title}`;
  return `• ${title} — ${description}`;
}

function detailedChoiceBody(body = '', rows = []) {
  const base = String(body || '').trim();
  const details = rows.map(choiceDetailLine).join('\n');
  return details ? `${base}\n\n${details}` : base;
}

function canUseReplyButtons(interactive = {}) {
  if (interactive?.type !== 'list' || interactive?.forceList === true) return false;
  const rows = listRows(interactive);
  if (rows.length < 1 || rows.length > WHATSAPP_REPLY_BUTTON_LIMITS.count) return false;
  if (rows.some((row) => {
    const id = cleanChoiceId(row?.id);
    const title = buttonTitle(row?.title);
    return !id
      || id.length > WHATSAPP_REPLY_BUTTON_LIMITS.id
      || !title;
  })) return false;
  const titles = rows.map((row) => buttonTitle(row.title).toLowerCase());
  if (new Set(titles).size !== titles.length) return false;
  return detailedChoiceBody(interactive.body, rows).length <= WHATSAPP_REPLY_BUTTON_LIMITS.body;
}

function hybridizeChoiceInteractive(interactive = {}) {
  if (!canUseReplyButtons(interactive)) return interactive;
  const rows = listRows(interactive);
  return {
    type: 'button',
    body: detailedChoiceBody(interactive.body, rows),
    buttons: rows.map((row) => ({
      id: cleanChoiceId(row.id),
      title: buttonTitle(row.title),
    })),
  };
}

module.exports = {
  WHATSAPP_REPLY_BUTTON_LIMITS,
  buttonTitle,
  canUseReplyButtons,
  cleanChoiceId,
  choiceDetailLine,
  detailedChoiceBody,
  hybridizeChoiceInteractive,
  listRows,
};
