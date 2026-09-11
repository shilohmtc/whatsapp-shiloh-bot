'use strict';

const { pool } = require('../db/pool');
const { resolveViewerFilter } = require('./schedulingEngine');

const FINAL_STATUSES = new Set(['completed', 'cancelled', 'no_show']);

function canonicalAppointment(row) {
  return {
    id: row.appointment_id,
    kind: 'appointment',
    canonical: true,
    source: 'appointments',
    provenance: { authority: 'appointments', canonical: true },
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    recordSource: row.record_source || null,
    clientName: row.client_name || 'Client',
    serviceName: row.service_name || 'Appointment',
    serviceContexts: Array.isArray(row.service_contexts) ? row.service_contexts.map(service => ({
      serviceId: Number(service.serviceId || service.service_id) || null,
      serviceName: service.serviceName || service.service_name || null,
      categoryName: service.categoryName || service.category_name || null,
      externalSource: service.externalSource || service.external_source || null,
      externalId: service.externalId || service.external_id || null,
    })) : [],
    revision: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    staff: [],
    staffIds: [],
  };
}

function aggregateAppointments(rows, permittedStaffIds) {
  const permitted = new Set(permittedStaffIds);
  const appointments = new Map();
  for (const row of rows || []) {
    if (FINAL_STATUSES.has(String(row.status || '').toLowerCase())) continue;
    const key = String(row.appointment_id);
    let item = appointments.get(key);
    if (!item) {
      item = canonicalAppointment(row);
      appointments.set(key, item);
    }
    const staffId = Number(row.assigned_staff_id);
    if (Number.isSafeInteger(staffId) && permitted.has(staffId) && !item.staffIds.includes(staffId)) {
      item.staffIds.push(staffId);
      item.staff.push({
        staffId,
        nameSnapshot: row.staff_name_snapshot || null,
        source: 'appointment_staff',
      });
    }
  }
  return [...appointments.values()];
}

function createWorkspaceDashboardBacklogService({ query = (text, params) => pool.query(text, params) } = {}) {
  async function listUnresolvedPastAppointments({ before, viewer } = {}) {
    const cutoff = new Date(before);
    if (!before || Number.isNaN(cutoff.getTime())) {
      throw new Error('Workspace Dashboard backlog requires a valid historical cutoff.');
    }

    const viewerFilter = resolveViewerFilter(viewer, null);
    if (viewerFilter.staffIds && viewerFilter.staffIds.length === 0) {
      return { staff: [], appointments: [] };
    }

    const staffResult = await query(`/* WorkspaceDashboardBacklog:staff */
      SELECT id, display_name
        FROM staff
       WHERE status='active'
         AND ($1::bigint[] IS NULL OR id = ANY($1::bigint[]))
       ORDER BY display_name, id`, [viewerFilter.staffIds]);
    const staff = staffResult.rows || [];
    const permittedStaffIds = staff.map(row => Number(row.id)).filter(Number.isSafeInteger);
    if (!permittedStaffIds.length) return { staff: [], appointments: [] };

    const appointmentResult = await query(`/* WorkspaceDashboardBacklog:appointments */
      SELECT a.id AS appointment_id,
             a.starts_at, a.ends_at, a.status, a.source AS record_source, a.updated_at,
             COALESCE(c.display_name,a.source_client_name,'Client') AS client_name,
             COALESCE((SELECT string_agg(aps.service_name_snapshot,' + ' ORDER BY aps.position)
                         FROM appointment_services aps WHERE aps.appointment_id=a.id),a.title,'Appointment') AS service_name,
             COALESCE((SELECT jsonb_agg(jsonb_build_object(
                               'serviceId', aps.service_id,
                               'serviceName', aps.service_name_snapshot,
                               'categoryName', sc.name,
                               'externalSource', s.external_source,
                               'externalId', s.external_id
                             ) ORDER BY aps.position)
                         FROM appointment_services aps
                         LEFT JOIN services s ON s.id=aps.service_id
                         LEFT JOIN service_categories sc ON sc.id=s.category_id
                        WHERE aps.appointment_id=a.id),'[]'::jsonb) AS service_contexts,
             ast.staff_id AS assigned_staff_id, ast.staff_name_snapshot
        FROM appointments a
        LEFT JOIN clients c ON c.id=a.client_id
        JOIN appointment_staff ast
          ON ast.appointment_id=a.id AND ast.staff_id = ANY($2::bigint[])
       WHERE a.status NOT IN ('completed','cancelled','no_show')
         AND a.ends_at < $1::timestamptz
       ORDER BY a.starts_at, a.id, ast.staff_id`, [cutoff.toISOString(), permittedStaffIds]);

    return {
      staff: staff.map(row => ({ id: Number(row.id), displayName: row.display_name })),
      appointments: aggregateAppointments(appointmentResult.rows || [], permittedStaffIds),
    };
  }

  return { listUnresolvedPastAppointments };
}

const service = createWorkspaceDashboardBacklogService();

module.exports = {
  aggregateAppointments,
  createWorkspaceDashboardBacklogService,
  listUnresolvedPastAppointments: service.listUnresolvedPastAppointments,
};
