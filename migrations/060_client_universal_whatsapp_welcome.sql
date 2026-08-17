CREATE TABLE IF NOT EXISTS client_whatsapp_welcome_deliveries (
  phone TEXT NOT NULL,
  welcome_version TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (phone, welcome_version)
);
