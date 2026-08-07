const multer = require("multer");
const path = require("path");

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".txt", ".md"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: MAX_UPLOAD_BYTES,
  },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return callback(new Error("Unsupported file type. Use PDF, DOCX, TXT, or Markdown"));
    }

    return callback(null, true);
  },
});

function documentUpload(req, res, next) {
  upload.single("file")(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "File exceeds the 10 MB upload limit",
        requestId: req.id,
      });
    }

    return res.status(400).json({
      error: error.message || "Invalid file upload",
      requestId: req.id,
    });
  });
}

module.exports = {
  documentUpload,
  MAX_UPLOAD_BYTES,
};
