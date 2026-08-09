-- Evidence-backed historical Goldie services recovered from appointment batch 2.
-- These records are intentionally inactive: they exist for historical reconciliation only
-- and must not be exposed as currently bookable services.
-- Personal is deliberately excluded because its duration is highly variable and all observed prices are R0.

INSERT INTO services (
  category_id, name, duration_minutes, processing_time_minutes, extra_time_minutes,
  variable_price, price, display_price, display_order, is_default, status,
  external_source, external_id
)
VALUES
  (
    NULL, 'Natural Nail Overlay', 60, 0, 0,
    TRUE, 300.00, 'Historical: usually R300', 9001, FALSE, 'inactive',
    'goldie_historical', 'natural-nail-overlay'
  ),
  (
    (SELECT id FROM service_categories WHERE name='Massage' LIMIT 1),
    'Lymphatic Drainage Massage', 90, 0, 0,
    TRUE, 650.00, 'Historical: usually R650', 9002, FALSE, 'inactive',
    'goldie_historical', 'lymphatic-drainage-massage'
  ),
  (
    NULL, 'Natural Overlay French/ Ombre', 80, 0, 0,
    FALSE, NULL, 'Historical price not established', 9003, FALSE, 'inactive',
    'goldie_historical', 'natural-overlay-french-ombre'
  ),
  (
    (SELECT id FROM service_categories WHERE name='Pedicures & Foot Care' LIMIT 1),
    'Foot Scrub Mothers day', 20, 0, 0,
    TRUE, 50.00, 'Historical Mothers Day add-on: usually R50', 9004, FALSE, 'inactive',
    'goldie_historical', 'foot-scrub-mothers-day'
  ),
  (
    NULL, 'Mom’s Reset Day', 80, 0, 0,
    TRUE, 450.00, 'Historical promotion: usually 80 min / R450', 9005, FALSE, 'inactive',
    'goldie_historical', 'moms-reset-day'
  ),
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
