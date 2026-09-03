const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createWorkspaceCommunicationEvidenceService,
  messageDeliveryEntry,
  rescheduleEntry,
  intentLabel,
} = require('../src/services/workspaceCommunicationEvidence');
const {
  renderCommunicationSection,
  renderClientDetailPageWithCommunications,
} = require('../src/presentation/workspaceCommunicationEvidenceUx');

function dbForEvidence() {
  return {
    calls: [],
    async query(sql, values) {
      this.calls.push({ sql, values });
      if (/messageDeliveries/.test(sql)) {
        return { rows: [
          {
            appointment_id: 71,
            message_kind: 'booking_confirmation',
            status: 'sent',
            claimed_at: '2026-09-01T08:00:00.000Z',
            sent_at: '2026-09-01T08:00:04.000Z',
            last_attempt_at: '2026-09-01T08:00:03.000Z',
            template_name: 'shiloh_booking_confirmation_v2',
            provider_sent_at: '2026-09-01T08:00:05.000Z',
            provider_delivered_at: '2026-09-01T08:00:08.000Z',
            provider_read_at: '2026-09-01T08:01:00.000Z',
            provider_failed_at: null,
          },
          {
            appointment_id: 72,
            message_kind: 'appointment_reminder_actions',
            status: 'sending',
            claimed_at: '2026-09-02T07:00:00.000Z',
            sent_at: null,
            last_attempt_at: null,
            template_name: 'shiloh_appointment_reminder_actions_v1',
            provider_sent_at: null,
            provider_delivered_at: null,
            provider_read_at: null,
            provider_failed_at: null,
          },
        ] };
      }
      if (/reschedules/.test(sql)) {
        return { rows: [
          { appointment_id: 73, client_notified_at: null, client_notification_last_error: 'provider unavailable', client_notification_claimed_at: '2026-09-02T06:00:00.000Z', client_notification_suppressed_at: null, updated_at: '2026-09-02T06:01:00.000Z' },
        ] };
      }
      if (/customerCare/.test(sql)) {
        return { rows: [
          { event_type: 'birthday_v2', sent_at: '2026-08-30T09:00:00.000Z' },
        ] };
      }
      throw new Error('Unexpected query');
    },
  };
}

function clientDetailModel(overrides = {}) {
  return {
    client: {
      id: 912,
      name: 'Synthetic Client',
      normalized_mobile: '27821234567',
      date_of_birth: '1994-02-18',
      gender: 'female',
      profile_status: 'registered',
      mobile_verified_at: '2026-08-28T10:00:00.000Z',
      status: 'active',
    },
    appointments: [],
    hasMore: false,
    historyOffset: 0,
    pageSize: 20,
    communications: [],
    ...overrides,
  };
}

test('communication evidence reads provider lifecycle and exact template without exposing provider identifiers', async () => {
  const db = dbForEvidence();
  const service = createWorkspaceCommunicationEvidenceService({ db });
  const evidence = await service.listForClient({ clientId: 912, waId: '+27 82 123 4567', limit: 30 });

  assert.equal(db.calls.length, 3);
  assert.match(db.calls[0].sql, /FROM customer_message_deliveries/);
  assert.match(db.calls[0].sql, /WHERE crm_v2_client_id=\$1/);
  assert.match(db.calls[0].sql, /template_name/);
  assert.match(db.calls[0].sql, /provider_sent_at/);
  assert.match(db.calls[0].sql, /provider_delivered_at/);
  assert.match(db.calls[0].sql, /provider_read_at/);
  assert.match(db.calls[0].sql, /provider_failed_at/);
  assert.doesNotMatch(db.calls[0].sql, /provider_message_id/);
  assert.deepEqual(db.calls[0].values, [912, 30]);
  assert.match(db.calls[1].sql, /appointment_reschedule_requests/);
  assert.match(db.calls[1].sql, /crm_v2_client_id=\$1/);
  assert.deepEqual(db.calls[2].values, ['27821234567', 30]);

  assert.equal(evidence[0].label, 'Appointment reminder');
  assert.equal(evidence[0].statusLabel, 'Pending');
  const booking = evidence.find(item => item.appointmentId === 71);
  assert.equal(booking.statusLabel, 'Read on WhatsApp');
  assert.equal(booking.templateName, 'shiloh_booking_confirmation_v2');
  assert.ok(evidence.some(item => item.label === 'Reschedule confirmation' && item.statusLabel === 'Send attempt failed'));
  assert.ok(evidence.some(item => item.label === 'Birthday message' && item.statusLabel === 'Sent by Shiloh'));
  assert.ok(evidence.every(item => !('providerMessageId' in item)));
});

test('provider evidence uses strongest truthful lifecycle state and never downgrades delivery/read', () => {
  const base = {
    appointment_id: 1,
    message_kind: 'booking_confirmation',
    status: 'sent',
    claimed_at: '2026-09-01T09:59:59Z',
    sent_at: '2026-09-01T10:00:00Z',
    template_name: 'shiloh_booking_confirmation_v2',
  };
  assert.equal(messageDeliveryEntry({ ...base, provider_sent_at: '2026-09-01T10:00:01Z' }).statusLabel, 'Sent to WhatsApp');
  assert.equal(messageDeliveryEntry({ ...base, provider_failed_at: '2026-09-01T10:00:02Z' }).statusLabel, 'WhatsApp delivery failed');
  assert.equal(messageDeliveryEntry({ ...base, provider_failed_at: '2026-09-01T10:00:02Z', provider_delivered_at: '2026-09-01T10:00:03Z' }).statusLabel, 'Delivered on WhatsApp');
  assert.equal(messageDeliveryEntry({ ...base, provider_failed_at: '2026-09-01T10:00:04Z', provider_delivered_at: '2026-09-01T10:00:03Z', provider_read_at: '2026-09-01T10:00:05Z' }).statusLabel, 'Read on WhatsApp');
  assert.equal(messageDeliveryEntry({ ...base, status: 'uncertain', sent_at: null, last_attempt_at: '2026-09-01T10:00:00Z' }).statusLabel, 'Delivery uncertain');
  assert.equal(rescheduleEntry({ appointment_id: 2, client_notification_suppressed_at: '2026-09-01T10:00:00Z' }).statusLabel, 'Suppressed');
  assert.equal(intentLabel('booking_update'), 'Booking update');
});

test('Client Communications UX shows Shiloh template and provider outcome but hides provider identifiers', () => {
  const html = renderClientDetailPageWithCommunications(clientDetailModel({
    communications: [{
      intent: 'booking_confirmation',
      label: 'Booking confirmation',
      status: 'delivered',
      statusLabel: 'Delivered on WhatsApp',
      occurredAt: '2026-09-01T08:00:08.000Z',
      appointmentId: 71,
      templateName: 'shiloh_booking_confirmation_v2',
    }],
  }), { calendarNavigationAllowed: true });

  assert.match(html, /data-client-communications/);
  assert.match(html, /Shiloh notification history/);
  assert.match(html, /Booking confirmation/);
  assert.match(html, /Delivered on WhatsApp/);
  assert.match(html, /Appointment #71/);
  assert.match(html, /Template: shiloh_booking_confirmation_v2/);
  assert.doesNotMatch(html, /provider_message_id|Graph API/i);
  assert.doesNotMatch(html, /Send message|Reply|Compose/);
});

test('communication evidence failure renders a neutral unavailable state rather than a false empty or delivery claim', () => {
  const html = renderClientDetailPageWithCommunications(clientDetailModel({
    communications: [],
    communicationsUnavailable: true,
  }));
  assert.match(html, /Communication evidence is temporarily unavailable/);
  assert.match(html, /No delivery claim is being made/);
  assert.doesNotMatch(html, /No recorded Shiloh notifications yet/);
});

test('communication section remains truthful when there is no recorded evidence', () => {
  const html = renderCommunicationSection([]);
  assert.match(html, /No recorded Shiloh notifications yet/);
  assert.doesNotMatch(html, /delivered/i);
});
