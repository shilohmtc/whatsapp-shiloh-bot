require("dotenv").config();

const express = require("express");

const webhookRoutes = require("./src/routes/webhook");

const app = express();

app.use(express.json());

// Routes
app.use("/", webhookRoutes);

app.get("/", (req, res) => {
    res.send("Shiloh WhatsApp AI Bot is running.");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Shiloh running on port ${PORT}`);
});