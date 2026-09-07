'use strict';

// Test-only preloader for the synthetic Calendar operational browser proof.
// The proof owns no database fixture for Workspace communication evidence, so
// fail that optional evidence capability closed instead of letting the default
// service attempt a real PostgreSQL connection from CI.
const notificationModule = require.resolve('../src/services/workspaceClientNotifications');

require.cache[notificationModule] = {
  id: notificationModule,
  filename: notificationModule,
  loaded: true,
  exports: {
    async requireAccess() {
      const error = new Error('Synthetic Calendar proof has no notification authority.');
      error.code = 'WORKSPACE_CLIENT_NOTIFY_FORBIDDEN';
      error.httpStatus = 403;
      throw error;
    },
    async getAppointmentConfirmation() {
      throw new Error('Notification evidence must remain unreachable without synthetic authority.');
    },
    async sendBookingConfirmation() {
      throw new Error('Notification sends are forbidden in the synthetic Calendar proof.');
    },
  },
};
