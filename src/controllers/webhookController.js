const { sendWhatsAppMessage } = require("../services/whatsapp");
const { generateReply } = require("../services/ai");
const { updateProfileFromMessage } = require("../services/profileExtractor");
const { CLINIC_REDIRECT, evaluateClinicScope } = require("../services/scopeGuard");
const { processBookingMessage } = require("../services/bookingIntent");
const { processBookingPolicyMessage, sanitizeBookingReply } = require("../services/bookingPolicy");
const { guardClientFreelancerBooking } = require("../services/clientBookingStaffGuard");
const { guardEnglishOnly } = require("../services/englishLanguageGuard");
const { processAppointmentChangeMessage } = require("../services/appointmentChange");
const { processCustomerExperienceMessage } = require("../services/customerExperience");
const { processCustomerCareMessage } = require("../services/customerCare");
const { processClientIdentityMessage } = require("../services/clientIdentityOnboarding");
const { processAdminWalkinMessage } = require("../services/adminWalkin");
const { processAdminHelpMessage } = require("../services/adminHelp");
const { processAdminMobileMenuMessage } = require("../services/adminMobileMenu");
const { processAdminMobileBookingFlowMessage } = require("../services/adminMobileBookingFlow");
const { processAdminAppointmentsByDateMessage } = require("../services/adminAppointmentsByDate");
const { processAdminReportsMessage } = require("../services/adminReports");
const { processAdminRosterAuditMessage } = require("../services/adminRosterAudit");
const { processAdminNailServicesAuditMessage } = require("../services/adminNailServicesAudit");
const { processAdminLegacyOrphanAuditMessage } = require("../services/adminLegacyOrphanAudit");
const { processAdminAvailableSlotsMessage } = require("../services/adminAvailableSlots");
const { processAdminStaffServicesMessage } = require("../services/adminStaffServices");
const { processAdminLoyaltyRedemptionMessage } = require("../services/adminLoyaltyRedemption");
const { processAdminAssistantMessage } = require("../services/adminAssistant");
const { forceMatchedClientNameConfirmation, guardActiveNameConfirmation } = require("../services/identityOnboardingGuard");
const logger = require("../lib/logger");
function maskPhone(phone = "") { return phone.length > 4 ? `***${phone.slice(-4)}` : "***"; }
function isGreetingOnly(text = "") { return /^(hi|hello|hey|good morning|good afternoon|good evening|howzit|hiya)[!. ]*$/i.test(String(text).trim()); }
exports.verifyWebhook = (req,res)=>{const mode=req.query["hub.mode"],token=req.query["hub.verify_token"],challenge=req.query["hub.challenge"];if(mode==="subscribe"&&token===process.env.VERIFY_TOKEN){(req.log||logger).info("WhatsApp webhook verified");return res.status(200).send(challenge);}(req.log||logger).warn("WhatsApp webhook verification rejected");return res.sendStatus(403);};
exports.receiveWebhook=async(req,res)=>{const log=req.log||logger;try{const value=req.body.entry?.[0]?.changes?.[0]?.value;if(!value?.messages)return res.sendStatus(200);const message=value.messages[0];if(message.type!=="text"){log.info({messageType:message.type},"Ignoring unsupported WhatsApp message");return res.sendStatus(200);}const from=message.from,text=message.text?.body?.trim();if(!from||!text){log.warn("Received malformed WhatsApp text message");return res.sendStatus(200);}log.info({from:maskPhone(from)},"Processing incoming WhatsApp message");try{
const language=await guardEnglishOnly(text);if(!language.allowed){log.info({from:maskPhone(from)},"Rejected non-English WhatsApp message");await sendWhatsAppMessage(from,language.reply);return res.sendStatus(200);}
const adminSlots=await processAdminAvailableSlotsMessage(from,text);if(adminSlots.handled){log.info({from:maskPhone(from),admin:adminSlots.admin?.display_name},"Handled authoritative available-slots request");await sendWhatsAppMessage(from,adminSlots.reply);return res.sendStatus(200);}
const staffServices=await processAdminStaffServicesMessage(from,text);if(staffServices.handled){await sendWhatsAppMessage(from,staffServices.reply);return res.sendStatus(200);}
const activeMobileBooking=await processAdminMobileBookingFlowMessage(from,text);if(activeMobileBooking.handled){await sendWhatsAppMessage(from,activeMobileBooking.reply);return res.sendStatus(200);}
const adminReports=await processAdminReportsMessage(from,text);if(adminReports.handled){await sendWhatsAppMessage(from,adminReports.reply);return res.sendStatus(200);}
const adminAppointments=await processAdminAppointmentsByDateMessage(from,text);if(adminAppointments.handled){await sendWhatsAppMessage(from,adminAppointments.reply);return res.sendStatus(200);}
const adminMobile=await processAdminMobileMenuMessage(from,text);if(adminMobile.handled){await sendWhatsAppMessage(from,adminMobile.reply);return res.sendStatus(200);}
const rosterAudit=await processAdminRosterAuditMessage(from,text);if(rosterAudit.handled){await sendWhatsAppMessage(from,rosterAudit.reply);return res.sendStatus(200);}
const nailAudit=await processAdminNailServicesAuditMessage(from,text);if(nailAudit.handled){await sendWhatsAppMessage(from,nailAudit.reply);return res.sendStatus(200);}
const legacyOrphanAudit=await processAdminLegacyOrphanAuditMessage(from,text);if(legacyOrphanAudit.handled){await sendWhatsAppMessage(from,legacyOrphanAudit.reply);return res.sendStatus(200);}
const adminHelp=await processAdminHelpMessage(from,text);if(adminHelp.handled){await sendWhatsAppMessage(from,adminHelp.reply);return res.sendStatus(200);}
const adminWalkin=await processAdminWalkinMessage(from,text);if(adminWalkin.handled){await sendWhatsAppMessage(from,adminWalkin.reply);return res.sendStatus(200);}
const adminLoyalty=await processAdminLoyaltyRedemptionMessage(from,text);if(adminLoyalty.handled){await sendWhatsAppMessage(from,adminLoyalty.reply);return res.sendStatus(200);}
const adminAssistant=await processAdminAssistantMessage(from,text);if(adminAssistant.handled){await sendWhatsAppMessage(from,adminAssistant.reply);return res.sendStatus(200);}
const customerExperience=await processCustomerExperienceMessage(from,text);if(customerExperience.handled){await sendWhatsAppMessage(from,customerExperience.reply);return res.sendStatus(200);}
const customerCare=await processCustomerCareMessage(from,text);if(customerCare.handled){await sendWhatsAppMessage(from,customerCare.reply);return res.sendStatus(200);}
const nameGuard=await guardActiveNameConfirmation(from,text);if(nameGuard.handled){await sendWhatsAppMessage(from,nameGuard.reply);return res.sendStatus(200);}
const identity=await processClientIdentityMessage(from,text);if(identity.handled){let reply=identity.reply;if(identity.identityStatus==="matched_incomplete"&&identity.client?.id){const forced=await forceMatchedClientNameConfirmation(from,identity.client.id);if(forced)reply=`Welcome back, ${identity.client.display_name}. Before I can continue with the booking, please confirm your full name.`;}if(identity.onboardingComplete&&identity.resumeBooking){const booking=await processBookingMessage(from,"I want to book an appointment");if(booking.handled&&booking.reply)reply=`${reply}\n\n${sanitizeBookingReply(booking.reply)}`;}await sendWhatsAppMessage(from,reply);return res.sendStatus(200);}
if(identity.identityStatus==="matched_incomplete"&&identity.client?.display_name&&isGreetingOnly(text)){await sendWhatsAppMessage(from,`Welcome back, ${identity.client.display_name} 👋 How can I help you today?`);return res.sendStatus(200);}
const scope=evaluateClinicScope(text);if(!scope.allowed){await sendWhatsAppMessage(from,CLINIC_REDIRECT);return res.sendStatus(200);}
const freelancerGuard=await guardClientFreelancerBooking(text);if(freelancerGuard.blocked){log.info({from:maskPhone(from),staff:freelancerGuard.staff?.display_name||null},"Blocked client freelancer booking request");await sendWhatsAppMessage(from,freelancerGuard.reply);return res.sendStatus(200);}
const appointmentChange=await processAppointmentChangeMessage(from,text);if(appointmentChange.handled){await sendWhatsAppMessage(from,appointmentChange.reply);return res.sendStatus(200);}
const bookingPolicy=await processBookingPolicyMessage(from,text);if(bookingPolicy.handled){await sendWhatsAppMessage(from,bookingPolicy.reply);return res.sendStatus(200);}
const booking=await processBookingMessage(from,text);if(booking.handled){await sendWhatsAppMessage(from,sanitizeBookingReply(booking.reply));return res.sendStatus(200);}
await updateProfileFromMessage(from,text);const reply=await generateReply(from,text);await sendWhatsAppMessage(from,reply);
}catch(error){log.error({err:error,from:maskPhone(from)},"Failed to process WhatsApp message");try{await sendWhatsAppMessage(from,"Sorry, I'm having trouble responding right now. Please try again in a moment.");}catch(fallbackError){log.error({err:fallbackError},"Failed to send WhatsApp fallback message");return res.sendStatus(500);}}return res.sendStatus(200);}catch(error){log.error({err:error},"Unhandled WhatsApp webhook error");return res.sendStatus(500);}};