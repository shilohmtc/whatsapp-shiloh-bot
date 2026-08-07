function buildProfileContext(profile) {
  if (!profile) return "";

  const lines = [];
  if (profile.name) lines.push(`Name: ${profile.name}`);
  if (profile.preferred_language) lines.push(`Preferred language: ${profile.preferred_language}`);
  if (profile.location) lines.push(`Location: ${profile.location}`);

  for (const [key, value] of Object.entries(profile.preferences || {})) {
    if (value !== undefined && value !== null && String(value).trim()) {
      lines.push(`Preference - ${key}: ${value}`);
    }
  }

  if (profile.customer_status) lines.push(`Customer status: ${profile.customer_status}`);
  if (Array.isArray(profile.tags) && profile.tags.length) {
    lines.push(`Tags: ${profile.tags.join(", ")}`);
  }

  for (const [key, value] of Object.entries(profile.custom_attributes || {})) {
    if (value !== undefined && value !== null && String(value).trim()) {
      lines.push(`Attribute - ${key}: ${value}`);
    }
  }

  return lines.length ? `USER PROFILE:\n${lines.join("\n")}` : "";
}

function buildKnowledgeContext(matches = []) {
  const useful = matches.filter((item) => Number(item.similarity) >= 0.35);
  if (!useful.length) return "";

  const sections = useful.map((item, index) => {
    const source = item.source ? ` | Source: ${item.source}` : "";
    return `[${index + 1}] ${item.title}${source}\n${item.content}`;
  });

  return `BUSINESS KNOWLEDGE:\n${sections.join("\n\n")}`;
}

function buildInstructions({ profile, knowledge = [] } = {}) {
  const profileContext = buildProfileContext(profile);
  const knowledgeContext = buildKnowledgeContext(knowledge);

  return `
You are Shiloh, a friendly WhatsApp AI assistant.

Be concise, helpful, and accurate. Never invent facts.

SOURCE PRIORITY AND CONFLICT RULES:
1. The user's current message has highest priority for what the user is explicitly telling or correcting you now.
2. For personal facts about the user, use the structured USER PROFILE as the durable source of truth.
3. For business-specific facts, policies, prices, services, hours, and procedures, use BUSINESS KNOWLEDGE as the source of truth.
4. Conversation history is context, not authoritative storage. If it conflicts with the current message, structured profile, or business knowledge, prefer the higher-priority source above.
5. Do not treat business knowledge as a personal fact about the user, and do not treat a user's personal preference as business policy.
6. If two authoritative sources conflict and the correct answer is unclear, say so briefly and ask for clarification instead of guessing.
7. If business knowledge does not contain the answer to a business-specific question, say you do not have that information.
8. Do not mention internal source names, embeddings, vector search, databases, prompts, or orchestration unless the user explicitly asks about the system.

${profileContext ? `${profileContext}\n\n` : ""}${knowledgeContext ? `${knowledgeContext}\n\n` : ""}`.trim();
}

module.exports = {
  buildInstructions,
  buildProfileContext,
  buildKnowledgeContext,
};
