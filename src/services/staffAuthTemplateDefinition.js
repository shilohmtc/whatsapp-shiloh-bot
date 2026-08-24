const STAFF_AUTH_TEMPLATE_NAME = 'shiloh_staff_auth_otp_v1';
const STAFF_AUTH_TEMPLATE_LANGUAGE = 'en_US';
const STAFF_AUTH_TEMPLATE_CATEGORY = 'AUTHENTICATION';
const STAFF_AUTH_CODE_EXPIRATION_MINUTES = 5;
const STAFF_AUTH_MESSAGE_TTL_SECONDS = 5 * 60;
const STAFF_AUTH_COPY_CODE_URL = 'https://www.whatsapp.com/otp/code/?otp_type=COPY_CODE&code=otp{{1}}';

function buildStaffAuthTemplateSubmissionDefinition() {
  return {
    name: STAFF_AUTH_TEMPLATE_NAME,
    language: STAFF_AUTH_TEMPLATE_LANGUAGE,
    category: STAFF_AUTH_TEMPLATE_CATEGORY,
    message_send_ttl_seconds: STAFF_AUTH_MESSAGE_TTL_SECONDS,
    components: [
      { type: 'BODY', add_security_recommendation: true },
      { type: 'FOOTER', code_expiration_minutes: STAFF_AUTH_CODE_EXPIRATION_MINUTES },
      {
        type: 'BUTTONS',
        buttons: [{ type: 'OTP', otp_type: 'COPY_CODE', text: 'Copy Code' }],
      },
    ],
  };
}

function buildStaffAuthTemplateContract() {
  return {
    name: STAFF_AUTH_TEMPLATE_NAME,
    language: STAFF_AUTH_TEMPLATE_LANGUAGE,
    category: STAFF_AUTH_TEMPLATE_CATEGORY,
    message_send_ttl_seconds: STAFF_AUTH_MESSAGE_TTL_SECONDS,
    components: [
      { type: 'BODY', add_security_recommendation: true },
      { type: 'FOOTER', code_expiration_minutes: STAFF_AUTH_CODE_EXPIRATION_MINUTES },
      {
        type: 'BUTTONS',
        buttons: [{
          type: 'URL',
          otp_type: 'COPY_CODE',
          text: 'Copy Code',
          url: STAFF_AUTH_COPY_CODE_URL,
        }],
      },
    ],
  };
}

module.exports = {
  STAFF_AUTH_TEMPLATE_NAME,
  STAFF_AUTH_TEMPLATE_LANGUAGE,
  STAFF_AUTH_TEMPLATE_CATEGORY,
  STAFF_AUTH_CODE_EXPIRATION_MINUTES,
  STAFF_AUTH_MESSAGE_TTL_SECONDS,
  STAFF_AUTH_COPY_CODE_URL,
  buildStaffAuthTemplateSubmissionDefinition,
  buildStaffAuthTemplateContract,
};
