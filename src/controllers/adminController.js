const {
  ingestDocument,
  listDocuments,
  deleteDocument,
} = require("../services/knowledge");

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
