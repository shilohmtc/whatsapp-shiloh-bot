const express = require("express");
const adminAuth = require("../middleware/adminAuth");
const { documentUpload } = require("../middleware/documentUpload");
const {
  createDocument,
  uploadDocument,
  getDocuments,
  removeDocument,
  getProfiles,
  getProfileByPhone,
  patchProfileByPhone,
} = require("../controllers/adminController");
const {
  syncGoldie,
  getGoldieSyncStatus,
} = require("../controllers/goldieController");
const {
  createLifecycleAppointment,
  getLifecycleAppointments,
  patchLifecycleAppointment,
  runLifecycleScan,
} = require("../controllers/appointmentLifecycleController");
const {
  getFeedback,
  getReviews,
  getCustomerSatisfaction,
  resolveCustomerFeedback,
} = require("../controllers/customerExperienceController");

const router = express.Router();

router.use(adminAuth);
router.get("/documents", getDocuments);
router.post("/documents", createDocument);
router.post("/documents/upload", documentUpload, uploadDocument);
router.delete("/documents/:id", removeDocument);

router.get("/profiles", getProfiles);
router.get("/profiles/:phone", getProfileByPhone);
router.patch("/profiles/:phone", patchProfileByPhone);

router.get("/sync/goldie", getGoldieSyncStatus);
router.post("/sync/goldie", syncGoldie);

router.get("/appointments", getLifecycleAppointments);
router.post("/appointments", createLifecycleAppointment);
router.patch("/appointments/:id", patchLifecycleAppointment);
router.post("/appointments/scan", runLifecycleScan);

router.get("/feedback", getFeedback);
router.patch("/feedback/:id/resolve", resolveCustomerFeedback);
router.get("/reviews", getReviews);
router.get("/customer-satisfaction", getCustomerSatisfaction);

module.exports = router;
