-- P3 professional customer-facing descriptions for the 49 active services verified 11 Aug 2026.
-- Presentation content only: no names, prices, durations, staff mappings, clients or appointments are changed.
UPDATE services SET customer_description = CASE name
WHEN 'Medi-Heel Pedicure (No Gel Toes) & Foot Massage' THEN 'A restorative foot-care treatment combining Medi-Heel pedicure care with a relaxing foot massage, without gel polish application.'
WHEN 'Medi-Heel Pedicure (With Gel Toes) & Foot Massage' THEN 'A complete Medi-Heel foot-care treatment with gel polish application and a relaxing foot massage for a polished finish.'
WHEN 'Hydrate & Plump Facial' THEN 'A moisture-focused facial designed to support a refreshed, supple-looking complexion with a nourishing treatment experience.'
WHEN 'Formulage Brightening Peel' THEN 'A professional facial peel focused on brightening and refreshing the appearance of dull or uneven-looking skin.'
WHEN 'Dermaplane Facial' THEN 'A facial treatment that combines professional skincare with dermaplaning to remove surface buildup and fine facial hair for a smoother-looking finish.'
WHEN 'Eternal Glow Facial' THEN 'A premium facial experience focused on radiance, hydration and an refreshed-looking complexion.'
WHEN 'Derma Peel Brightening' THEN 'A professional peel treatment focused on improving the appearance of dullness and uneven-looking tone while supporting a refreshed complexion.'
WHEN 'Lip Plump Treatment' THEN 'A focused cosmetic lip treatment designed to support a smoother, more hydrated and fuller-looking lip appearance.'
WHEN 'Sculpt Deluxe' THEN 'A premium facial treatment combining advanced skincare techniques to support a more refined, refreshed and sculpted-looking complexion.'
WHEN 'Derma Fusion Clarity Facial' THEN 'An advanced clarity-focused facial for clients wanting a deep-cleansing, refreshed and balanced-looking complexion.'
WHEN 'Contour Lift Facial' THEN 'An advanced facial focused on contouring and firming techniques for a refreshed, lifted-looking appearance.'
WHEN 'Calm & Clear Facial' THEN 'A soothing facial designed for skin that needs a gentler, calming and clarifying treatment approach.'
WHEN 'Hybrid Facial' THEN 'A customised advanced facial that combines complementary treatment techniques according to the client’s skin goals and suitability.'
WHEN 'Firm & Lift' THEN 'A premium facial treatment focused on firming, contouring and supporting a refreshed, lifted-looking appearance.'
WHEN 'Brightening Facial (Pigmentation)' THEN 'A brightening facial focused on the appearance of uneven tone and pigmentation while supporting a clearer, more radiant-looking complexion.'
WHEN 'Acne Detox Facial' THEN 'A deep-cleansing facial focused on congested or breakout-prone skin, with treatment choices tailored to the client’s current skin condition.'
WHEN 'Basic Facial - Acne / Congested / Hormonal Breakout' THEN 'A targeted basic facial for congested or breakout-prone skin, focused on cleansing, balancing and appropriate supportive skincare.'
WHEN 'Basic Facial - Hydration / Pigmentation Targeted' THEN 'A targeted basic facial focused on hydration and the appearance of uneven tone, selected according to the client’s current skin needs.'
WHEN 'Clarity Facial (Blackheads, Whiteheads & Acne)' THEN 'A clarity-focused facial for congested skin, including professional cleansing and treatment tailored to visible blackheads, whiteheads and breakouts.'
WHEN 'Full Body Swedish' THEN 'A classic full-body relaxation massage using flowing techniques to encourage comfort, relaxation and an overall sense of wellbeing.'
WHEN 'Facial Lymphatic Drainage Massage' THEN 'A gentle facial massage using light, rhythmic techniques intended to support relaxation and normal lymphatic movement.'
WHEN 'Sports Massage Full Body' THEN 'A longer full-body sports massage using focused massage techniques for clients wanting attention across multiple muscle groups.'
WHEN 'Quick Relief: Back & Neck (45 min)' THEN 'A focused 45-minute massage for the back and neck, ideal when you want targeted treatment in a shorter appointment.'
WHEN 'Targeted Area-Specific Sports Massage' THEN 'A focused sports massage for a selected body area, using targeted techniques according to the client’s comfort and treatment goals.'
WHEN 'Upper Back, Neck & Jaw Release' THEN 'A targeted massage session focusing on the upper back, neck and jaw areas to support relaxation and ease muscular tension.'
WHEN 'Hot Stone Massage' THEN 'A relaxing massage incorporating warmed stones alongside massage techniques for a soothing, comforting treatment experience.'
WHEN 'Soothing & Restorative Pregnancy Massage' THEN 'A supportive pregnancy massage adapted for comfort, positioning and relaxation during pregnancy.'
WHEN 'Renew & Revive Leg and Foot Massage' THEN 'A focused leg and foot massage designed as a restorative, relaxing treatment for tired-feeling legs and feet.'
WHEN 'Full Body Sports Massage' THEN 'A full-body sports massage using focused techniques for clients seeking treatment across major muscle groups.'
WHEN 'Lower Back, Hip & Psoas Release' THEN 'A targeted massage session focusing on the lower back, hips and psoas region using techniques selected for the client’s comfort and goals.'
WHEN 'Cupping Area Specific' THEN 'A targeted treatment using massage cupping on a selected area as part of a focused bodywork session.'
WHEN 'Bamboo Sports Massage - Area Specific' THEN 'A targeted sports massage incorporating bamboo tools on a selected area for focused pressure and bodywork techniques.'
WHEN 'Lymphatic Drainage Reset Package' THEN 'A structured lymphatic drainage treatment session using gentle techniques to support normal lymphatic movement and relaxation.'
WHEN 'Permanent Makeup - Eyeliner' THEN 'A permanent makeup service for cosmetic eyeliner enhancement, planned according to the client’s preferred style, features and suitability.'
WHEN 'Permanent Makeup - Brows' THEN 'A permanent makeup service for brow enhancement, with shape and style planned according to the client’s features and preferences.'
WHEN 'Permanent Makeup - Lips' THEN 'A permanent makeup service for cosmetic lip colour and definition, planned according to the client’s preferred result and suitability.'
WHEN 'Areola Reconstruction' THEN 'A specialist cosmetic pigmentation consultation/service focused on areola appearance and individual treatment planning.'
WHEN 'Stretch Mark Microneedling Consultation' THEN 'A consultation to assess stretch-mark concerns, discuss microneedling suitability, treatment planning, pricing and aftercare.'
WHEN 'VHC Standard Needling with Vitamins under Local Anesthetic.' THEN 'An advanced microneedling treatment using a vitamin-focused protocol with local anaesthetic, selected according to the treatment area and client suitability.'
WHEN 'GF Needling with Growth Factors under Local Anesthetic' THEN 'An advanced microneedling treatment using a growth-factor-focused protocol with local anaesthetic, planned according to the treatment area and client suitability.'
WHEN 'Profosma Jet Plasma' THEN 'An advanced plasma-based aesthetic treatment with the treatment plan and pricing determined by the selected area, goals and suitability assessment.'
WHEN 'Plasma Fybroblast' THEN 'A consultation for plasma fibroblast treatment to discuss the area of concern, suitability, treatment planning, pricing and aftercare.'
WHEN 'Priced according to area' THEN 'Plasma fibroblast treatment pricing is determined by the treatment area. A consultation is recommended to confirm the appropriate option and price.'
WHEN 'Ozone & Far Infrared Therapy' THEN 'A wellness treatment combining ozone and far-infrared therapy in a relaxing clinic setting, with the session selected according to the client’s needs and suitability.'
WHEN '1. SQT Anti-Aging Rejuvenation BioMicroneedling + SQT Revitalizing Beauty BioMicroneedling' THEN 'An SQT BioMicroneedling option focused on rejuvenation and revitalising skincare goals, selected according to the client’s skin assessment and suitability.'
WHEN '2. SQT Resurfacing BioMicroneedling + SQT Nourishing Hydrating BioMicroneedling' THEN 'An SQT BioMicroneedling option focused on resurfacing, nourishment and hydration goals, selected according to the client’s skin assessment and suitability.'
WHEN 'HIFU (High-Intensity Focused Ultrasound)' THEN 'An advanced HIFU aesthetic treatment with the treatment area and plan selected according to the client’s goals, assessment and suitability.'
WHEN 'Pelvic Floor Strengthening' THEN 'A non-invasive pelvic floor therapy session focused on pelvic muscle stimulation and strengthening support. Suitability is assessed before treatment.'
WHEN 'HIFU' THEN 'A HIFU-based intimate aesthetic treatment offered following an appropriate suitability assessment and treatment discussion.'
ELSE customer_description END,
booking_note = CASE
WHEN name IN ('Permanent Makeup - Eyeliner','Permanent Makeup - Brows','Permanent Makeup - Lips','Areola Reconstruction','Stretch Mark Microneedling Consultation','VHC Standard Needling with Vitamins under Local Anesthetic.','GF Needling with Growth Factors under Local Anesthetic','Profosma Jet Plasma','Plasma Fybroblast','Priced according to area','1. SQT Anti-Aging Rejuvenation BioMicroneedling + SQT Revitalizing Beauty BioMicroneedling','2. SQT Resurfacing BioMicroneedling + SQT Nourishing Hydrating BioMicroneedling','HIFU (High-Intensity Focused Ultrasound)','Pelvic Floor Strengthening','HIFU') THEN 'Consultation or suitability assessment may be required before treatment.'
WHEN name = 'Soothing & Restorative Pregnancy Massage' THEN 'Please mention your stage of pregnancy and any relevant care guidance when booking.'
ELSE booking_note END,
updated_at = NOW()
WHERE status = 'active';

DO $$
DECLARE missing_count integer;
BEGIN
  SELECT COUNT(*) INTO missing_count FROM services WHERE status='active' AND COALESCE(trim(customer_description),'')='';
  IF missing_count <> 0 THEN RAISE EXCEPTION 'Customer description seed incomplete: % active services remain blank', missing_count; END IF;
END $$;
