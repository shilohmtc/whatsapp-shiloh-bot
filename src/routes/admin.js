const express = require("express");
const adminAuth = require("../middleware/adminAuth");
const { documentUpload } = require("../middleware/documentUpload");
const {
  createDocument,
  uploadDocument,
  getDocuments,
  removeDocument,
} = require("../controllers/adminController");

const router = express.Router();

router.use(adminAuth);
router.get("/documents", getDocuments);
router.post("/documents", createDocument);
router.post("/documents/upload", documentUpload, uploadDocument);
router.delete("/documents/:id", removeDocument);

module.exports = router;
