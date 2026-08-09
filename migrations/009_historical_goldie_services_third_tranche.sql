-- Third evidence-backed historical Goldie service tranche recovered from appointment batch 2.
-- These records are inactive and exist only to reconcile historical Goldie appointments.
-- Personal remains explicitly excluded from catalogue canonicalization.

INSERT INTO services (
  category_id, name, duration_minutes, processing_time_minutes, extra_time_minutes,
  variable_price, price, display_price, display_order, is_default, status,
  external_source, external_id
)
VALUES
  (
    NULL, 'Aquarelle', 10, 0, 0,
    FALSE, 40.00, 'Historical nail-art add-on: repeated combination evidence supports 10 min / R40',
    9020, FALSE, 'inactive',
    'goldie_historical', 'aquarelle'
  ),
  (
    NULL, 'Extension S', 90, 0, 0,
    FALSE, 320.00, 'Historical nail extension service: standalone 90 min / R320; repeated combinations corroborate pricing',
    9021, FALSE, 'inactive',
    'goldie_historical', 'extension-s'
  )
ON CONFLICT (external_source, external_id) DO UPDATE SET
  category_id=EXCLUDED.category_id,
  name=EXCLUDED.name,
  duration_minutes=EXCLUDED.duration_minutes,
  processing_time_minutes=EXCLUDED.processing_time_minutes,
  extra_time_minutes=EXCLUDED.extra_time_minutes,
  variable_price=EXCLUDED.variable_price,
  price=EXCLUDED.price,
  display_price=EXCLUDED.display_price,
  display_order=EXCLUDED.display_order,
  is_default=FALSE,
  status='inactive',
  updated_at=NOW();
