const express = require("express");
const adminAuth = require("../middleware/adminAuth");
const {
  createDocument,
  getDocuments,
  removeDocument,
} = require("../controllers/adminController");

const router = express.Router();

router.use(adminAuth);
router.get("/documents", getDocuments);
router.post("/documents", createDocument);
router.delete("/documents/:id", removeDocument);

module.exports = router;
