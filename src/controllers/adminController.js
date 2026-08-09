const path = require("path");
const {
  ingestDocument,
  listDocuments,
  deleteDocument,
} = require("../services/knowledge");
const { extractDocumentText } = require("../services/documentParser");
const { getProfile, upsertProfile, listProfiles } = require("../services/profile");
const { sendWhatsAppTemplate } = require("../services/whatsapp");

exports.createDocument = async (req, res) => {
  try {
    const { title, source, content } = req.body || {};

    if (!title || !content) {
      return res.status(400).json({
        error: "title and content are required",
        requestId: req.id,
      });
    }

    if (String(content).length > 200000) {
      return res.status(413).json({
        error: "Document content is too large for this endpoint",
        requestId: req.id,
      });
    }

    const document = await ingestDocument({ title, source, content });

    return res.status(201).json({
      document,
      requestId: req.id,
    });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to ingest document");
    return res.status(500).json({
      error: "Document ingestion failed",
      requestId: req.id,
    });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Attach one file using the form-data field named 'file'",
        requestId: req.id,
      });
    }

    const parsed = await extractDocumentText(req.file);
    const requestedTitle = String(req.body?.title || "").trim();
    const fallbackTitle = path.basename(
      req.file.originalname,
      path.extname(req.file.originalname)
    );
    const title = requestedTitle || fallbackTitle || "Uploaded document";
    const source = String(req.body?.source || req.file.originalname).trim();

    const document = await ingestDocument({
      title,
      source,
      content: parsed.text,
    });

    return res.status(201).json({
      document,
      upload: {
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        bytes: req.file.size,
        extension: parsed.extension,
        extractedChars: parsed.extractedChars,
      },
      requestId: req.id,
    });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to process uploaded document");

    const message = String(error.message || "");
    const clientError =
      message.includes("Unsupported file type") ||
      message.includes("readable text") ||
      message.includes("character limit") ||
      message.includes("No upload file");

    return res.status(clientError ? 400 : 500).json({
      error: clientError ? message : "Uploaded document ingestion failed",
      requestId: req.id,
    });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const documents = await listDocuments();
    return res.status(200).json({ documents, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to list documents");
    return res.status(500).json({
      error: "Could not list documents",
      requestId: req.id,
    });
  }
};

exports.removeDocument = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid document id", requestId: req.id });
    }

    const deleted = await deleteDocument(id);
    if (!deleted) {
      return res.status(404).json({ error: "Document not found", requestId: req.id });
    }

    return res.status(200).json({ deleted, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to delete document");
    return res.status(500).json({
      error: "Could not delete document",
      requestId: req.id,
    });
  }
};

exports.getProfiles = async (req, res) => {
  try {
    const profiles = await listProfiles(req.query.limit);
    return res.status(200).json({ profiles, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to list user profiles");
    return res.status(500).json({
      error: "Could not list user profiles",
      requestId: req.id,
    });
  }
};

exports.getProfileByPhone = async (req, res) => {
  try {
    const profile = await getProfile(req.params.phone);
    if (!profile) {
      return res.status(404).json({ error: "User profile not found", requestId: req.id });
    }
    return res.status(200).json({ profile, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to read user profile");
    return res.status(500).json({ error: "Could not read user profile", requestId: req.id });
  }
};

exports.patchProfileByPhone = async (req, res) => {
  try {
    const allowed = [
      "name",
      "preferredLanguage",
      "preferred_language",
      "location",
      "preferences",
      "customerStatus",
      "customer_status",
      "tags",
      "customAttributes",
      "custom_attributes",
    ];

    const patch = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) {
        patch[key] = req.body[key];
      }
    }

    const profile = await upsertProfile(req.params.phone, patch);
    if (!profile) {
      return res.status(500).json({ error: "Could not update user profile", requestId: req.id });
    }

    return res.status(200).json({ profile, requestId: req.id });
  } catch (error) {
    (req.log || console).error?.({ err: error }, "Failed to update user profile");
    return res.status(500).json({ error: "Could not update user profile", requestId: req.id });
  }
};

exports.sendTemplateTest = async (req, res) => {
  const allowedTemplates = {
    appointment_reminder: 4,
    appointment_followup: 2,
  };

  try {
    const { to, templateName, parameters, languageCode = "en" } = req.body || {};
    const phone = String(to || "").replace(/[^0-9]/g, "");
    const expectedParameterCount = allowedTemplates[templateName];

    if (!phone || phone.length < 8 || phone.length > 15) {
      return res.status(400).json({
        error: "A valid international WhatsApp number is required",
        requestId: req.id,
      });
    }

    if (!expectedParameterCount) {
      return res.status(400).json({
        error: "Template is not approved for the admin test endpoint",
        allowedTemplates: Object.keys(allowedTemplates),
        requestId: req.id,
      });
    }

    if (!Array.isArray(parameters) || parameters.length !== expectedParameterCount) {
      return res.status(400).json({
        error: `${templateName} requires exactly ${expectedParameterCount} body parameters`,
        requestId: req.id,
      });
    }

    const safeParameters = parameters.map((value) => String(value ?? "").slice(0, 500));
    if (safeParameters.some((value) => !value.trim())) {
      return res.status(400).json({
        error: "Template parameters cannot be empty",
        requestId: req.id,
      });
    }

    const result = await sendWhatsAppTemplate(
      phone,
      templateName,
      safeParameters,
      String(languageCode || "en")
    );

    return res.status(200).json({
      sent: true,
      to: phone,
      templateName,
      messageId: result.messages?.[0]?.id || null,
      requestId: req.id,
    });
  } catch (error) {
    (req.log || console).error?.(
      { err: error, metaError: error.response?.data?.error },
      "Failed to send WhatsApp template test"
    );

    return res.status(error.response?.status || 500).json({
      error: "WhatsApp template test failed",
      metaError: error.response?.data?.error || null,
      requestId: req.id,
    });
  }
};
