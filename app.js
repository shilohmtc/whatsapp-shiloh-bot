require("dotenv").config();
const express = require("express");
const { validateEnv } = require("./src/config/env");
const logger = require("./src/lib/logger");
const requestContext = require("./src/middleware/requestContext");
validateEnv();
const webhookRoutes = require("./src/routes/webhook");
const adminRoutes = require("./src/routes/admin");
const auditReadRoutes = require("./src/routes/auditRead");
const { checkDatabase } = require("./src/services/memory");
const { pool } = require("./src/db/pool");
const { getPostCanonicalizationAudit } = require("./src/services/canonicalizationAudit");
const { getAppointmentIdentityEvidence } = require("./src/services/appointmentIdentityEvidence");
const { getSecondPassReconciliation } = require("./src/services/secondPassReconciliation");
const { getManualQueue } = require("./src/services/manualReconciliationQueue");
const { runConfiguredCreateNewPromotion } = require("./src/services/createNewClientPromotion");
const { startGoldieSyncScheduler } = require("./src/services/goldieSync");
const { startAppointmentLifecycleScheduler } = require("./src/services/appointmentLifecycle");
const app = express();
app.disable("x-powered-by"); app.use(express.json({ limit: "2mb" })); app.use(requestContext);
app.get("/", (req,res)=>res.status(200).json({service:"shiloh-whatsapp-bot",status:"running"}));
app.get("/health", async (req,res)=>{ const ok=await checkDatabase(); return res.status(ok?200:503).json({status:ok?"ok":"degraded",database:ok?"ok":"unavailable",timestamp:new Date().toISOString()}); });
app.use("/audit-read",auditReadRoutes); app.use("/admin",adminRoutes); app.use("/",webhookRoutes);
app.use((err,req,res,next)=>{ const log=req.log||logger; log.error({err},"Unhandled Express error"); if(res.headersSent)return next(err); return res.status(500).json({error:"Internal server error",requestId:req.id}); });
const PORT=process.env.PORT||3000;
async function logCanonicalizationAuditStatus(){try{const r=await getPostCanonicalizationAudit("1");logger.info({canonicalizationAudit:{batchId:r.batchId,overallPass:r.overallPass,checks:r.checks}},"Canonicalization audit status");}catch(error){logger.error({err:error},"Canonicalization audit status failed");}}
async function logAppointmentIdentityEvidenceStatus(){try{const r=await getAppointmentIdentityEvidence({clientBatchId:"1",appointmentBatchId:"2"});logger.info({appointmentIdentityEvidence:{clientBatchId:r.clientBatchId,appointmentBatchId:r.appointmentBatchId,summary:r.summary}},"Appointment identity evidence summary");}catch(error){logger.error({err:error},"Appointment identity evidence summary failed");}}
async function logSecondPassStatus(){try{const r=await getSecondPassReconciliation({clientBatchId:"1",appointmentBatchId:"2"});logger.info({secondPassReconciliation:{clientBatchId:r.clientBatchId,appointmentBatchId:r.appointmentBatchId,summary:r.summary}},"Second-pass reconciliation summary");}catch(error){logger.error({err:error},"Second-pass reconciliation summary failed");}}
async function logTopManualQueue(){try{const r=await getManualQueue({clientBatchId:"1",appointmentBatchId:"2"});logger.info({manualQueueReview:{summary:r.summary,top:r.items.slice(0,30).map(i=>({queueId:i.queueId,displayName:i.displayName,reason:i.reason,candidateClientId:i.candidateClientId,priority:i.priority,exactAppointmentCount:i.exactAppointmentCount,nearAppointmentCount:i.nearAppointmentCount,appointmentEvidence:i.appointmentEvidence,secondPassClassification:i.secondPassClassification,secondPassConfidence:i.secondPassConfidence,supportedActions:i.supportedActions}))}},"Manual reconciliation review window");}catch(error){logger.error({err:error},"Manual reconciliation review window failed");}}
async function logDuplicateNameEvidence(){try{const q=await pool.query(`SELECT q.id AS queue_id,er.external_id,ecr.display_name,ecr.normalized_phone,ecr.email,ecr.secondary_phone,ecr.notes,er.raw_payload FROM client_reconciliation_queue q JOIN external_records er ON er.id=q.external_record_id JOIN external_client_records ecr ON ecr.external_record_id=er.id WHERE q.id IN (199,698,723,726) ORDER BY ecr.display_name,q.id`);logger.info({duplicateNameEvidence:q.rows.map(r=>({queueId:String(r.queue_id),externalId:r.external_id,displayName:r.display_name,phoneFingerprint:r.normalized_phone?String(r.normalized_phone).slice(-4):null,emailPresent:Boolean(r.email),secondaryPhonePresent:Boolean(r.secondary_phone),notesPresent:Boolean(r.notes),rawFingerprint:require('crypto').createHash('sha256').update(JSON.stringify(r.raw_payload||{})).digest('hex').slice(0,12)}))},"Duplicate-name reconciliation evidence");}catch(error){logger.error({err:error},"Duplicate-name reconciliation evidence failed");}}
async function runControlledStartupDataWork(){try{await runConfiguredCreateNewPromotion(logger);}catch(error){logger.error({err:error},"Configured Goldie create-new promotion failed");} await logCanonicalizationAuditStatus(); await logAppointmentIdentityEvidenceStatus(); await logSecondPassStatus(); await logTopManualQueue(); await logDuplicateNameEvidence();}
const server=app.listen(PORT,()=>{logger.info({port:PORT},"Shiloh started");startGoldieSyncScheduler();startAppointmentLifecycleScheduler();runControlledStartupDataWork();});
function shutdown(signal){logger.info({signal},"Shutting down Shiloh");server.close(()=>{logger.info("HTTP server closed");process.exit(0);});setTimeout(()=>{logger.error("Forced shutdown after timeout");process.exit(1);},10000).unref();}
process.on("SIGTERM",()=>shutdown("SIGTERM")); process.on("SIGINT",()=>shutdown("SIGINT"));
