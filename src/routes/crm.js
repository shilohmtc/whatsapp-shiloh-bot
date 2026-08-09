const express = require("express");
const {
  listClients, getClient, getClientAppointments,
  listServices, listStaff, listAppointments, getAppointment,
  listAvailableSlots, getStaffWorkingHours, replaceStaffWorkingHoursDay,
  addStaffScheduleException, removeStaffScheduleException,
} = require("../controllers/crmController");

const router = express.Router();

router.get("/clients", listClients);
router.get("/clients/:id/appointments", getClientAppointments);
router.get("/clients/:id", getClient);
router.get("/services", listServices);
router.get("/staff", listStaff);
router.get("/staff/:id/working-hours", getStaffWorkingHours);
router.put("/staff/:id/working-hours/:day", replaceStaffWorkingHoursDay);
router.post("/staff/:id/schedule-exceptions", addStaffScheduleException);
router.delete("/staff/:id/schedule-exceptions/:exceptionId", removeStaffScheduleException);
router.get("/availability", listAvailableSlots);
router.get("/appointments", listAppointments);
router.get("/appointments/:id", getAppointment);

module.exports = router;
