async function listEligibleReplacementServices(queryable, { appointmentId, currentServiceId = null } = {}) {
  const values = [Number(appointmentId)];
  const currentPredicate = currentServiceId == null ? '' : `AND s.id<>$${values.push(Number(currentServiceId))}`;
  const result = await queryable.query(
    `SELECT DISTINCT s.id,s.name,s.duration_minutes,s.processing_time_minutes,s.extra_time_minutes,
            s.price,s.variable_price,s.display_price
       FROM services s
      WHERE s.status='active'
        ${currentPredicate}
        AND COALESCE(s.external_source,'')<>'shiloh_package'
        AND NOT EXISTS (
          SELECT 1 FROM service_packages sp
           WHERE sp.session_service_id=s.id AND sp.status='active'
        )
        AND NOT EXISTS (
          SELECT 1 FROM appointment_staff ast
           WHERE ast.appointment_id=$1
             AND ast.staff_id IS NOT NULL
             AND NOT EXISTS (
               SELECT 1 FROM staff_services ss
                WHERE ss.staff_id=ast.staff_id AND ss.service_id=s.id
             )
        )
      ORDER BY s.name,s.id`,
    values
  );
  return result.rows;
}

async function updateSingleAppointmentTreatment(queryable, {
  appointmentId,
  appointmentServiceId,
  serviceId,
  serviceName,
  durationMinutes,
  priceSnapshot,
  endsAt,
} = {}) {
  await queryable.query(
    `UPDATE appointment_services
        SET service_id=$1,service_name_snapshot=$2,duration_minutes_snapshot=$3,price_snapshot=$4
      WHERE id=$5`,
    [serviceId, serviceName, durationMinutes, priceSnapshot, appointmentServiceId]
  );
  if (endsAt == null) {
    await queryable.query(
      `UPDATE appointments SET title=$1,updated_at=NOW() WHERE id=$2`,
      [serviceName, appointmentId]
    );
  } else {
    await queryable.query(
      `UPDATE appointments SET ends_at=$1,title=$2,updated_at=NOW() WHERE id=$3`,
      [endsAt, serviceName, appointmentId]
    );
  }
}

async function updateAppointmentChargedPrice(queryable, {
  appointmentId,
  appointmentServiceId = null,
  chargedPrice,
} = {}) {
  await queryable.query(
    `UPDATE appointments SET total_price=$1,updated_at=NOW() WHERE id=$2`,
    [chargedPrice, appointmentId]
  );
  if (appointmentServiceId != null) {
    await queryable.query(
      `UPDATE appointment_services SET price_snapshot=$1 WHERE id=$2`,
      [chargedPrice, appointmentServiceId]
    );
  }
}

async function updateSingleAppointmentTreatmentAndPrice(queryable, input = {}) {
  await updateSingleAppointmentTreatment(queryable, input);
  await updateAppointmentChargedPrice(queryable, input);
}

module.exports = {
  listEligibleReplacementServices,
  updateSingleAppointmentTreatment,
  updateAppointmentChargedPrice,
  updateSingleAppointmentTreatmentAndPrice,
};
