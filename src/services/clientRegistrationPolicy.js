const REQUIRED_REGISTRATION_FIELDS = Object.freeze([
  "full_name",
  "mobile_number",
  "date_of_birth",
]);

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function registrationStatus({ fullName, mobileNumber, dateOfBirth } = {}) {
  const missing = [];
  if (!hasText(fullName)) missing.push("full_name");
  if (!hasText(mobileNumber)) missing.push("mobile_number");
  if (!dateOfBirth) missing.push("date_of_birth");

  return {
    complete: missing.length === 0,
    missing,
    required: [...REQUIRED_REGISTRATION_FIELDS],
  };
}

function assertRegistrationComplete(input) {
  const status = registrationStatus(input);
  if (!status.complete) {
    const error = new Error(`Client registration is incomplete: missing ${status.missing.join(", ")}`);
    error.code = "CLIENT_REGISTRATION_INCOMPLETE";
    error.missing = status.missing;
    throw error;
  }
  return status;
}

// Registration completeness deliberately does not imply identity/contact verification.
// A staff-entered walk-in mobile can satisfy registration while remaining unverified.
function identityVerificationStatus({ contactVerified = false } = {}) {
  return { verified: Boolean(contactVerified) };
}

module.exports = {
  REQUIRED_REGISTRATION_FIELDS,
  registrationStatus,
  assertRegistrationComplete,
  identityVerificationStatus,
};
