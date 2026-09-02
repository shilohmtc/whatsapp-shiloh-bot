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
          { appointment_id: 71, message_kind: 'booking_confirmation', status: 'sent', claimed_at: '2026-09-01T08:00:00.000Z', sent_at: '2026-09-01T08:00:04.000Z' },
          { appointment_id: 72, message_kind: 'appointment_reminder_actions', status: 'sending', claimed_at: '2026-09-02T07:00:00.000Z', sent_at: null },
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

test('communication evidence reads canonical CRM V2 delivery state and never selects provider identifiers', async () => {
  const db = dbForEvidence();
  const service = createWorkspaceCommunicationEvidenceService({ db });
  const evidence = await service.listForClient({ clientId: 912, waId: '+27 82 123 4567', limit: 30 });

  assert.equal(db.calls.length, 3);
  assert.match(db.calls[0].sql, /FROM customer_message_deliveries/);
  assert.match(db.calls[0].sql, /WHERE crm_v2_client_id=\$1/);
  assert.doesNotMatch(db.calls[0].sql, /template_name|provider_message_id/);
  assert.deepEqual(db.calls[0].values, [912, 30]);
  assert.match(db.calls[1].sql, /appointment_reschedule_requests/);
  assert.match(db.calls[1].sql, /crm_v2_client_id=\$1/);
  assert.deepEqual(db.calls[2].values, ['27821234567', 30]);

  assert.equal(evidence[0].label, 'Appointment reminder');
  assert.equal(evidence[0].statusLabel, 'Pending');
  assert.ok(evidence.some(item => item.label === 'Booking confirmation' && item.statusLabel === 'Sent by Shiloh'));
  assert.ok(evidence.some(item => item.label === 'Reschedule confirmation' && item.statusLabel === 'Send attempt failed'));
  assert.ok(evidence.some(item => item.label === 'Birthday message' && item.statusLabel === 'Sent by Shiloh'));
  assert.ok(evidence.every(item => !('providerMessageId' in item) && !('templateName' in item)));
});

test('status semantics do not overclaim WhatsApp delivery', () => {
  assert.deepEqual(messageDeliveryEntry({ appointment_id: 1, message_kind: 'booking_confirmation', status: 'sent', sent_at: '2026-09-01T10:00:00Z' }).statusLabel, 'Sent by Shiloh');
  assert.deepEqual(messageDeliveryEntry({ appointment_id: 1, message_kind: 'booking_confirmation', status: 'sending', claimed_at: '2026-09-01T10:00:00Z' }).statusLabel, 'Pending');
  assert.equal(rescheduleEntry({ appointment_id: 2, client_notification_suppressed_at: '2026-09-01T10:00:00Z' }).statusLabel, 'Suppressed');
  assert.equal(intentLabel('booking_update'), 'Booking update');
});

test('Client Communications UX is Shiloh-owned, read-only and hides Meta/provider internals', () => {
  const html = renderClientDetailPageWithCommunications(clientDetailModel({
    communications: [{
      intent: 'booking_confirmation',
      label: 'Booking confirmation',
      status: 'sent',
      statusLabel: 'Sent by Shiloh',
      occurredAt: '2026-09-01T08:00:04.000Z',
      appointmentId: 71,
    }],
  }), { calendarNavigationAllowed: true });

  assert.match(html, /data-client-communications/);
  assert.match(html, /Shiloh notification history/);
  assert.match(html, /Booking confirmation/);
  assert.match(html, /Sent by Shiloh/);
  assert.match(html, /Appointment #71/);
  assert.doesNotMatch(html, /provider_message_id|template_name|Meta template|Graph API/i);
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
