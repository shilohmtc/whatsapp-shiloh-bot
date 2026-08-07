const path = require("path");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");

const MAX_EXTRACTED_CHARS = 300000;

const SUPPORTED_EXTENSIONS = new Set([".pdf", ".docx", ".txt", ".md"]);

function normalizeText(text) {
  return String(text || "")
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function getExtension(filename = "") {
  return path.extname(filename).toLowerCase();
}

function assertSupportedFile(file) {
  if (!file?.buffer || !file.originalname) {
    throw new Error("No upload file was provided");
  }

  const extension = getExtension(file.originalname);
  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    throw new Error("Unsupported file type. Use PDF, DOCX, TXT, or Markdown");
  }

  return extension;
}

async function extractDocumentText(file) {
  const extension = assertSupportedFile(file);
  let text = "";

  if (extension === ".pdf") {
    const parsed = await pdfParse(file.buffer);
    text = parsed.text;
  } else if (extension === ".docx") {
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    text = parsed.value;
  } else {
    text = file.buffer.toString("utf8");
  }

  const normalized = normalizeText(text);

  if (!normalized) {
    throw new Error("The uploaded document did not contain readable text");
  }

  if (normalized.length > MAX_EXTRACTED_CHARS) {
    throw new Error(
      `Extracted text exceeds the ${MAX_EXTRACTED_CHARS.toLocaleString()} character limit`
    );
  }

  return {
    text: normalized,
    extension,
    extractedChars: normalized.length,
  };
}

module.exports = {
  extractDocumentText,
  SUPPORTED_EXTENSIONS,
  MAX_EXTRACTED_CHARS,
};
