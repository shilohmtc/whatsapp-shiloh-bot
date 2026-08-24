-- Shiloh OS Goldie Wave B customer-description publication.
-- Control authority: PR #447.
-- Exact approved set: 15 claim-level rows only.
-- Retained Goldie source: export (33).csv
-- Source SHA-256: fdcba9cf4145d0e4925630d65a103a9d0fa6ba3c618e33fb7c428aae27c84d16
--
-- This migration is intentionally not directly runnable through the generic
-- migration path. The guarded Wave B bootstrap must first verify the exact
-- canonical rows, current descriptions, status/eligibility, mappings and all
-- non-target descriptions, then set this transaction-local authority marker.

DO $$
BEGIN
  IF current_setting('shiloh.goldie_wave_b_authority', true) IS DISTINCT FROM 'PR447' THEN
    RAISE EXCEPTION 'Goldie Wave B publication requires guarded PR447 authority';
  END IF;
END $$;

WITH approved(external_id, description) AS (
  VALUES
  ('e4510fa9-579f-46dd-8fff-107c00748597', $desc$An Elim MediHeel callus removal pedicure is a premium, 9-step treatment focused on stubborn, thick, and dead skin on the heels without blades. Using a specialized alkaline callus tonic, this restorative, luxurious spa experience includes ingredients like urea and AHA.
Key Features and Treatment Elements
• No Blades/Filing: Uses a keratolytic alkaline solution as part of the callus-care process.
• Tonic Application: A 10-minute application of the tonic forms part of the treatment.
• Treatment Ingredients: Features Alpha
Hydroxy Acids (AHA) and Urea as part of the treatment protocol.$desc$),
  ('8814ad67-f670-4c4b-ae22-2cb1233afb96', $desc$Tone Gel is a lightweight, fast-drying gel application for colour and shine, providing a polished nail finish.
+- 200 colours to choose from$desc$),
  ('b534a8e5-3fe1-46e9-9ca0-bba116e6bf53', $desc$Medi-Heel Pedicure offers a blade-free 9-step foot-care treatment using AHA and urea, focused on callus care and hydration. Topped up with a Gel Application for colour and a polished finish.$desc$),
  ('074c7773-2e78-4761-a9c6-c72dc02f7994', $desc$Purpose: This is a non-surgical plasma-based aesthetic treatment for the face and body. It uses cold, low-atmospheric plasma. The device works without needles or anesthesia.

Face, Neck, Decolletage treatment:

Face to Jawline R5500 (1 Cycle = 3 treatments) 1h30 per treatment
Neck & decolletage R5500 (1Cycle = 3 treatments) 1h30 per treatment
R8500 (2 Cycles = 6 treatments)
R12500 (3 Cycles = 9 Treatments)

Body Treatment:
Consultation R400 (30Min)$desc$),
  ('9726c400-234d-489a-9e5c-d247c21e4a85', $desc$Plasma Fybroblast
Purpose: Fybroblast therapy is a plasma-based aesthetic treatment using a pen-like device that creates a small electric arc (plasma) just above the skin under local anesthesia. Plasma creates small, controlled superficial treatment points on the skin.

Tiny carbon crusts form on the spots treated, which typically fall off within a few days.$desc$),
  ('49730b6c-133d-4e60-b98c-d33a1091d02d', $desc$Pressotherapy is a non-invasive compression treatment using a specialized suit fitted over the limbs and abdomen and connected to a controlled air-pressure system. During the session, the suit gently inflates and deflates in a rhythmic sequence, creating a massage-like compression experience.$desc$),
  ('8d5ee63d-8caa-45aa-b2d3-2a91d2478672', $desc$Ozone & Far Infrared Therapy.
Packages available.$desc$),
  ('c830d602-0e71-499e-9348-114584c8a985', $desc$1. SQT Anti-Aging Rejuvenation BioMicroneedling
Treatment focus:
• Mature-skin rejuvenation
• Fine-line and wrinkle appearance
• Firmness-focused skincare

Skin types/concerns considered during consultation:
• Mature Skin
• Dry Skin
• Sensitive Skin
• Combination Skin
R2585 (Full Face to Jawline) (1H30)
R2585 (Jawline to Breast) (1H30)

2. SQT Revitalizing Beauty BioMicroneedling
Treatment focus:
• Texture and tone-focused skincare
• Pigmentation appearance
• Revitalising skincare

Skin types/concerns considered during consultation:
• Hyperpigmentation
• Oily Skin
• Sensitive Skin & Compromised Skin
• Combination Skin
R1785(Full Face to Jawline) (1H30)
R1785 (Jawline to Breast) (1H30)$desc$),
  ('46043512-d1df-4169-92b4-132160fca809', $desc$A full-body sports massage using focused massage and stretch techniques across multiple muscle groups. The session is tailored to the client’s activity level, areas of tension, comfort and treatment goals.
Ideal for athletes, active individuals, or clients seeking focused bodywork across the full body.$desc$),
  ('e8c5bf09-c583-4bcc-9da9-a560180cf776', $desc$Purpose: Consultation to assess stretch-mark or scar concerns, discuss microneedling suitability, treatment planning and pricing.
Pricing on consultation R400 (30 min consultation)$desc$),
  ('69805dfe-8238-47d2-8b1d-f154f0033e27', $desc$Face, Neck & Decolletage
Purpose: HIFU (High Intensity Focused Ultrasound) is an ultrasound-based aesthetic treatment for the face, neck and decolletage. The treatment area, suitability and session plan are confirmed during assessment.

R2950 (Full Face to Jawline)
R900 (Neck)
Pre & Post in salon treatments included.$desc$),
  ('61a0a7db-426d-4ecf-94ff-9fd6855f384d', $desc$Experience a relaxing 90-minute full body Swedish massage using gentle, rhythmic strokes tailored to your comfort and preferences.$desc$),
  ('2d5b6147-ee9f-4a97-8e27-6270751c2673', $desc$Targeted Area Specific Sports Massage uses focused sports-massage techniques on a selected body area, tailored to the client’s comfort, activity level and treatment goals.$desc$),
  ('406d85e9-4d36-42d3-9611-ab1834038662', $desc$A gentle full body soft-touch massage designed for pregnancy. Performed in a side-lying position with pregnancy pillows for comfort, the treatment focuses on areas such as the lower back and hips and uses slow, flowing massage movements for a calm, supportive treatment experience.$desc$),
  ('409ef0e8-2063-47b2-86db-ca0af30787de', $desc$Experience our Cupping Area Specific therapy, using cupping techniques on a selected body region as part of a focused bodywork session. Treatment is tailored to the client’s comfort and treatment goals.$desc$)
)
UPDATE services s
   SET customer_description = a.description,
       updated_at = NOW()
  FROM approved a
 WHERE s.external_source = 'goldie'
   AND s.external_id = a.external_id;