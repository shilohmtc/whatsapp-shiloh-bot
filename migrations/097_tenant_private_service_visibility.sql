-- Canonical Calendar visibility policy for tenant-private services.
-- staff_services remains practitioner capability/assignment data; absence of a row
-- here means the service keeps ordinary business visibility.

CREATE TABLE IF NOT EXISTS service_visibility_policies (
  service_id BIGINT PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
  visibility_scope TEXT NOT NULL,
  owner_staff_id BIGINT NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT service_visibility_policies_scope_check
    CHECK (visibility_scope = 'tenant_private')
);

CREATE INDEX IF NOT EXISTS idx_service_visibility_policies_owner
  ON service_visibility_policies(owner_staff_id, service_id);

-- Conservative one-time backfill: only active services assigned to exactly one
-- active practitioner, where that practitioner currently has an active canonical
-- tenant_practitioner admin identity. No service or person names participate.
WITH active_practitioner_assignments AS (
  SELECT ss.service_id,
         COUNT(DISTINCT st.id)::INTEGER AS active_practitioner_count,
         MIN(st.id) AS sole_staff_id
    FROM staff_services ss
    JOIN staff st ON st.id = ss.staff_id
    JOIN services svc ON svc.id = ss.service_id
   WHERE svc.status = 'active'
     AND st.status = 'active'
     AND st.resource_type = 'practitioner'
   GROUP BY ss.service_id
), active_tenant_practitioners AS (
  SELECT DISTINCT a.staff_id
    FROM staff_admin_accounts a
    JOIN staff st ON st.id = a.staff_id
   WHERE a.active = TRUE
     AND a.business_role = 'tenant_practitioner'
     AND st.status = 'active'
     AND st.resource_type = 'practitioner'
     AND a.staff_id IS NOT NULL
)
INSERT INTO service_visibility_policies (service_id, visibility_scope, owner_staff_id)
SELECT assignment.service_id, 'tenant_private', assignment.sole_staff_id
  FROM active_practitioner_assignments assignment
  JOIN active_tenant_practitioners tenant
    ON tenant.staff_id = assignment.sole_staff_id
 WHERE assignment.active_practitioner_count = 1
ON CONFLICT (service_id) DO NOTHING;
