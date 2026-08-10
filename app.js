require("dotenv").config();
const express = require("express");
const { validateEnv } = require("./src/config/env");
const logger = require("./src/lib/logger");
const requestContext = require("./src/middleware/requestContext");
const startupTestRequest = require("./config/shiloh-test-request.json");
validateEnv();

const webhookRoutes = require("./src/routes/webhook");
const adminRoutes = require("./src/routes/admin");
const auditReadRoutes = require("./src/routes/auditRead");
const calendarRoutes = require("./src/routes/calendar");
const walkinRoutes = require("./src/routes/walkin");
const { checkDatabase } = require("./src/services/memory");
const { applyPendingMigrations } = require("./src/services/migrations");
const { repairJeanPierreIdentity } = require("./src/services/identityRepair");
const { inspectCheniqueIdentity } = require("./src/services/cheniqueDiagnostic");
const { startGoldieSyncScheduler } = require("./src/services/goldieSync");
const { startGoogleBusinessProfileSyncScheduler } = require("./src/services/googleBusinessProfileSync");
const { startAppointmentLifecycleScheduler } = require("./src/services/appointmentLifecycle");
const { runStartupTestCommand } = require("./src/services/startupTestCommand");
const { runGoldieFutureImportFromEnv } = require("./src/services/goldieFutureImport");
const { runFromEnv: runGoogleCalendarReconciliationFromEnv } = require("./src/services/googleCalendarReconciliation");
const { runGoogleCalendarAccessSetupFromEnv } = require("./src/services/googleCalendarAccessSetup");
const { repairNatashaStaffAssignment } = require("./src/services/natashaStaffRepair");
const { runCrm6ProductionSmokeTest } = require("./src/services/crm6ProductionSmokeTest");
const { runCalendarPresentationReconciliation } = require("./src/services/calendarPresentationReconciliation");

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));
app.use(requestContext);
app.get("/", (req,res)=>res.status(200).json({service:"shiloh-whatsapp-bot",status:"running"}));
app.get("/health",async(req,res)=>{const ok=await checkDatabase();return res.status(ok?200:503).json({status:ok?"ok":"degraded",database:ok?"ok":"unavailable",timestamp:new Date().toISOString()});});
app.use("/audit-read",auditReadRoutes);app.use("/admin",adminRoutes);app.use("/calendar",calendarRoutes);app.use("/",walkinRoutes);app.use("/",webhookRoutes);
app.use((err,req,res,next)=>{const log=req.log||logger;log.error({err},"Unhandled Express error");if(res.headersSent)return next(err);return res.status(500).json({error:"Internal server error",requestId:req.id});});
const PORT=process.env.PORT||3000;let server;
async function start(){
 if(process.env.RUN_DB_MIGRATIONS_ON_STARTUP==="true"){const migrationResult=await applyPendingMigrations();logger.info({applied:migrationResult.applied},"Explicit startup database migrations applied");}
 if(process.env.RUN_JEAN_PIERRE_IDENTITY_REPAIR==="true"){const repairResult=await repairJeanPierreIdentity();logger.info(repairResult,"Guarded Jean-Pierre identity repair completed");}
 if(process.env.RUN_CHENIQUE_IDENTITY_DIAGNOSTIC==="true"){const diagnosticResult=await inspectCheniqueIdentity();logger.info(diagnosticResult,"Read-only Chenique identity diagnostic completed");}
 if(process.env.RUN_NATASHA_STAFF_REPAIR==="true"){const repairResult=await repairNatashaStaffAssignment();logger.info(repairResult,"Guarded Natasha practitioner repair completed");}
 if(process.env.RUN_CRM6_SMOKE_TEST==="true"){await runCrm6ProductionSmokeTest();}
 server=app.listen(PORT,()=>{logger.info({port:PORT},"Shiloh started");startGoldieSyncScheduler();startGoogleBusinessProfileSyncScheduler();startAppointmentLifecycleScheduler();setImmediate(()=>{
  runStartupTestCommand(startupTestRequest).catch(error=>logger.error({err:error},"Deploy-triggered Shiloh test command did not complete"));
  runGoldieFutureImportFromEnv().catch(error=>logger.error({err:error},"Goldie future booking import did not complete"));
  runGoogleCalendarReconciliationFromEnv().catch(error=>logger.error({err:error},"Google Calendar future reconciliation did not complete"));
  runGoogleCalendarAccessSetupFromEnv().catch(error=>logger.error({err:error},"Google Calendar staff access setup did not complete"));
  runCalendarPresentationReconciliation().catch(error=>logger.error({err:error},"CRM-6 calendar presentation reconciliation did not complete"));
 });});
}
start().catch(error=>{logger.fatal({err:error},"Shiloh failed during startup");process.exit(1);});
function shutdown(signal){logger.info({signal},"Shutting down Shiloh");if(!server)return process.exit(0);server.close(()=>{logger.info("HTTP server closed");process.exit(0);});setTimeout(()=>{logger.error("Forced shutdown after timeout");process.exit(1);},10000).unref();}
process.on("SIGTERM",()=>shutdown("SIGTERM"));process.on("SIGINT",()=>shutdown("SIGINT"));