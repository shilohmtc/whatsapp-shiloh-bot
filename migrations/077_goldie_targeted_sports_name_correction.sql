-- PR #447 exact mechanical service-name correction.
-- Goldie external id: 2d5b6147-ee9f-4a97-8e27-6270751c2673
-- Authorized change only: `Targated Area Specific Sports Massage`
--                      -> `Targeted Area-Specific Sports Massage`

DO $$
BEGIN
  IF current_setting('shiloh.goldie_targeted_sports_name_authority', true) IS DISTINCT FROM 'PR447' THEN
    RAISE EXCEPTION 'Targeted Sports name correction requires guarded PR447 authority';
  END IF;
END $$;

UPDATE services
   SET name = 'Targeted Area-Specific Sports Massage',
       updated_at = NOW()
 WHERE external_source = 'goldie'
   AND external_id = '2d5b6147-ee9f-4a97-8e27-6270751c2673'
   AND name = 'Targated Area Specific Sports Massage';