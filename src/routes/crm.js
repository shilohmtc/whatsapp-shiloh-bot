const express = require("express");
const {
  listClients, getClient, getClientAppointments,
  listServices, listStaff, listAppointments, getAppointment,
} = require("../controllers/crmController");

const router = express.Router();

router.get("/clients", listClients);
router.get("/clients/:id/appointments", getClientAppointments);
router.get("/clients/:id", getClient);
router.get("/services", listServices);
router.get("/staff", listStaff);
router.get("/appointments", listAppointments);
router.get("/appointments/:id", getAppointment);

module.exports = router;
