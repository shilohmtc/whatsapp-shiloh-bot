-- Second evidence-backed historical Goldie service tranche from appointment batch 2.
-- These are intentionally inactive and exist only to reconcile historical appointment history.
-- Personal remains excluded because the source evidence is R0 and duration-variable.

INSERT INTO services (
  category_id, name, duration_minutes, processing_time_minutes, extra_time_minutes,
  variable_price, price, display_price, display_order, is_default, status,
  external_source, external_id
)
VALUES
  (
    NULL, 'Hand Painted Art', 10, 0, 0,
    TRUE, 20.00, 'Historical nail-art add-on; inferred from repeated R320 overlay combinations', 9010, FALSE, 'inactive',
    'goldie_historical', 'hand-painted-art'
  ),
  (
    NULL, 'Hand Painted Art per nail', 10, 0, 0,
    FALSE, NULL, 'Historical per-nail art add-on; unit price not established', 9011, FALSE, 'inactive',
    'goldie_historical', 'hand-painted-art-per-nail'
  ),
  (
    (SELECT id FROM service_categories WHERE name='Pedicures & Foot Care' LIMIT 1),
    'Gel Polish Toes', 25, 0, 0,
    TRUE, 180.00, 'Historical toe gel add-on; repeated overlay combination totals R480', 9012, FALSE, 'inactive',
    'goldie_historical', 'gel-polish-toes'
  ),
  (
    NULL, 'Colour gel polish', 10, 0, 0,
    TRUE, 60.00, 'Historical colour gel add-on; repeated overlay combination totals R360', 9013, FALSE, 'inactive',
    'goldie_historical', 'colour-gel-polish'
  ),
  (
    NULL, 'Eyebrow wax shape & Tint', 40, 0, 0,
    FALSE, 150.00, 'Historical standalone evidence: 40 min / R150', 9014, FALSE, 'inactive',
    'goldie_historical', 'eyebrow-wax-shape-tint'
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
