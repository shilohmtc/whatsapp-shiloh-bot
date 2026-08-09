const express = require("express");
const adminAuth = require("../middleware/adminAuth");
const { documentUpload } = require("../middleware/documentUpload");
const { csvUpload } = require("../middleware/csvUpload");
const {
  createDocument,
  uploadDocument,
  getDocuments,
  removeDocument,
  getProfiles,
  getProfileByPhone,
  patchProfileByPhone,
  sendTemplateTest,
} = require("../controllers/adminController");
const {
  syncGoldie,
  getGoldieSyncStatus,
} = require("../controllers/goldieController");
const { stageClients: stageGoldieClients } = require("../controllers/goldieImportController");
const {
  getSummary: getReconciliationSummary,
  getRecommendations: getReconciliationRecommendations,
  getCanonicalizationAudit,
  canonicalizeClients: canonicalizeReconciliationClients,
  getCases: getReconciliationCases,
  getCase: getReconciliationCase,
} = require("../controllers/reconciliationController");
const {
  createLifecycleAppointment,
  getLifecycleAppointments,
  patchLifecycleAppointment,
  runLifecycleScan,
  runControlledLifecycleTest,
} = require("../controllers/appointmentLifecycleController");
const {
  getFeedback,
  getReviews,
  getCustomerSatisfaction,
  resolveCustomerFeedback,
} = require("../controllers/customerExperienceController");
const {
  getStatus: getDatabaseStatus,
  getTables: getDatabaseTables,
  getSchema: getDatabaseSchema,
  getOverview: getDatabaseOverview,
  getMigrations: getDatabaseMigrations,
  applyMigrations: applyDatabaseMigrations,
} = require("../controllers/databaseController");

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
router.post("/imports/goldie/clients", csvUpload, stageGoldieClients);
router.get("/reconciliation/clients/summary", getReconciliationSummary);
router.get("/reconciliation/clients/recommendations", getReconciliationRecommendations);
router.get("/reconciliation/clients/canonicalization-audit", getCanonicalizationAudit);
router.post("/reconciliation/clients/canonicalize", canonicalizeReconciliationClients);
router.get("/reconciliation/clients", getReconciliationCases);
router.get("/reconciliation/clients/:id", getReconciliationCase);

router.get("/appointments", getLifecycleAppointments);
router.post("/appointments", createLifecycleAppointment);
router.patch("/appointments/:id", patchLifecycleAppointment);
router.post("/appointments/scan", runLifecycleScan);
router.post("/appointments/test-lifecycle", runControlledLifecycleTest);

router.post("/whatsapp/templates/test", sendTemplateTest);

router.get("/feedback", getFeedback);
router.patch("/feedback/:id/resolve", resolveCustomerFeedback);
router.get("/reviews", getReviews);
router.get("/customer-satisfaction", getCustomerSatisfaction);

router.get("/database/status", getDatabaseStatus);
router.get("/database/tables", getDatabaseTables);
router.get("/database/schema", getDatabaseSchema);
router.get("/database/overview", getDatabaseOverview);
router.get("/database/migrations", getDatabaseMigrations);
router.post("/database/migrations/apply", applyDatabaseMigrations);

module.exports = router;
