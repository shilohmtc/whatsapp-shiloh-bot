const multer = require("multer");
const path = require("path");

const MAX_CSV_UPLOAD_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 1, fileSize: MAX_CSV_UPLOAD_BYTES },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    if (extension !== ".csv") return callback(new Error("Upload a CSV file"));
    return callback(null, true);
  },
});

function csvUpload(req, res, next) {
  upload.single("file")(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "CSV exceeds the 5 MB upload limit", requestId: req.id });
    }
    return res.status(400).json({ error: error.message || "Invalid CSV upload", requestId: req.id });
  });
}

module.exports = { csvUpload, MAX_CSV_UPLOAD_BYTES };
