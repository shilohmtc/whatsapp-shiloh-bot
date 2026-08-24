-- Goldie Wave A exact-source-first publication authorized by PR #441.
-- Source: export (33).csv
-- Source SHA-256: fdcba9cf4145d0e4925630d65a103a9d0fa6ba3c618e33fb7c428aae27c84d16
-- Scope: exactly 20 Goldie service rows: 18 VERBATIM + 2 punctuation-only MECHANICAL.
-- Presentation content only. Do not change names, prices, durations, service status,
-- staff mappings, booking notes, clients, appointments, Calendar or WhatsApp state.

DO $wave_a$
DECLARE
  v_target_count integer;
  v_updated_count integer;
BEGIN
  WITH approved(external_id, description) AS (
    VALUES
      ('082a3806-3b46-4469-88b8-68b5df95e82b', $desc$•⁠  ⁠Cleanse
•⁠  ⁠Pre-Peel
•⁠  ⁠Clarity Booster
•⁠  ⁠Needling with Booster
•⁠  ⁠Anti-Ageing Mask
•⁠  ⁠Ultrasound 5Min
•⁠  ⁠GF Serum needling
•⁠  ⁠Blue Photon lights 10min
•⁠  ⁠Cell recovery
•⁠  ⁠RF 8min
•⁠  ⁠High Frequency
•⁠  ⁠Acne Day Cream
•⁠  ⁠Sun Cream SPF50
•⁠  ⁠Cold Hammer
•⁠  ⁠(1Hour 30Min)$desc$),
      ('592f0d7d-5a54-4f01-a7ee-c10fb0715140', $desc$Acne Congested/Hormonal Break out skin:
•⁠  ⁠Cleanse
•⁠  ⁠Exfoliate- Micro Peel  
•⁠  ⁠Gentle Exfoliation Mask
•⁠  ⁠Growth Factor Serum
•⁠  ⁠Cell Recovery/ High Frequincy
•⁠  ⁠Formulage Eye Cream, Acne Day Cream & Sun Cream SPF30 – 
•⁠  ⁠Blue LED photon light therapy 10min 
•⁠  ⁠(1Hour )$desc$),
      ('1c7cdc7c-67b2-4c44-b999-1b900d27ca3c', $desc$•⁠  ⁠Cleanse
•⁠  ⁠Mechanical vellus hair removal
•⁠  ⁠Exfoliate
•⁠  ⁠Gentle Exfoliation Mask or Anti-ageing mask
•⁠  ⁠Growth Factor Serum or Anti-ageing serum
•⁠  ⁠Cell Recovery/Radio frequency or Ultrasound
•⁠  ⁠Massage
•⁠  ⁠Formulage Eye cream, Day cream & Sun Cream SPF30 
•⁠  ⁠Red Photon Light Therapy 10Min.
•⁠  ⁠(1Hour 30Min)$desc$),
      ('8caf9baa-c5b0-4b8a-b45e-b10ca2367c50', $desc$•⁠  ⁠Cleanse
•⁠  ⁠Exfoliate
•⁠  ⁠Anti-ageing mask
•⁠  ⁠Growth Factor Serum or Anti-ageing serum
•⁠  ⁠Cell Recovery/Radio frequency or Ultrasound
•⁠  ⁠Massage
•⁠  ⁠Formulage Eye cream, Day cream & Sun Cream SPF30  
•⁠  ⁠Red Photon Light Therapy 10Min
•	 (1 Hour 30 min)$desc$),
      ('3a5d1f78-4213-401a-b279-e674608c5c5b', $desc$⁠Cleanse
•⁠  ⁠Pre Peel & Clarity Booster
•⁠  ⁠Anti-ageing mask or Gentle exfoliation Mask
•⁠  ⁠Growth Factor Serum or Anti-ageing serum
•⁠  ⁠Cell Recovery & High Frequency
•⁠  ⁠Massage
•⁠  ⁠Formulage Eye cream, Day cream & Sun Cream SPF30  
•⁠  ⁠Red Photon Light Therapy 10Min
1h30min$desc$),
      ('178ff19a-a260-4915-af76-09c4f6884c39', $desc$•⁠  ⁠Cleanse
•⁠  ⁠Pre-Peel
•⁠  ⁠Brightening Booster 
•⁠  ⁠20% Glycolic Peel
•⁠  ⁠Neutralizer
•⁠  ⁠Anti-ageing Mask
•⁠  ⁠GF Serum
•⁠  ⁠Anti-Ageing Serum
•⁠  ⁠Cell Recovery
•⁠  ⁠Manual Massage


•⁠  ⁠Mechanical Massage
•⁠  ⁠Hyaluronic Spray
•⁠  ⁠Eye Cream
•⁠  ⁠Day Cream SPF30
•⁠  ⁠SPF50
•⁠  ⁠(1Hour 30min)$desc$),
      ('ca73086c-7a7a-47f8-90e4-992dfc8dd040', $desc$•⁠  ⁠Cleanse 
•⁠  ⁠Gentle Exfoliation Mask
•⁠  ⁠Blue Photon light 10min
•⁠  ⁠Anti-Ageing Mask
•⁠  ⁠GF Serum
•⁠  ⁠Cell Recovery
•⁠  ⁠Ultrasound 10min.
•⁠  ⁠Cell Recovery
•⁠  ⁠Manual Massage
•⁠  ⁠High Frequency
•⁠  ⁠Acne Day Cream
•⁠  ⁠Sun Cream SPF50
•⁠  ⁠Cold Hammer
•⁠  ⁠(1Hour 30min.)$desc$),
      ('d2adf221-5d19-43ff-bd7b-281aa21b2428', $desc$•⁠  ⁠Cleanse
•⁠  ⁠Exfoliation Mask
•⁠  ⁠Red Photon Light 10Min
•⁠  ⁠Anti-Ageing Mask
•⁠  ⁠VHC Serum
•⁠  ⁠5 Min RF
•⁠  ⁠Spade Removal
•⁠  ⁠Cell Recovery
•⁠  ⁠RF
•⁠  ⁠Massage
•⁠  ⁠Hyaluronic Spray
•⁠  ⁠HF
•⁠  ⁠Day Cream SPF30
•⁠  ⁠Sun Cream SPF50
•⁠  ⁠Cold Hammer
•⁠  ⁠1Hour 30min$desc$),
      ('f87d46dc-f525-409e-beb2-784c56769ae6', $desc$•	Cleanse
•	Pre-Peel
•	Brightening Booster
•	20% Glycolic Peel
•	Neutralize
•	Anti-ageing Mask
•	GF Serum
•	Anti-Ageing Serum
•	Cell Recovery.
•	RF
•	Hyaluronic Spray
•	HF
•	Red Photon light
•	Day Cream SPF30
•	Sun Cream SPF50
•	Cold Hammer
•	(1H30)$desc$),
      ('0dd673be-ab70-4694-8727-08debcae60b5', $desc$• Cleanse
• Pre-Peel
• Brightening Booster
• Hot Hammer 10min
• Anti-Ageing Mask
• GF Serum
• Cell Recovery
• RF Lifting 10Min
• Ultrasound
• Manual Massage
• Hyaluronic Spray
• HF
• Eye Cream
• Day Cream SPF30
• Sun Cream SPF50
• Cold Hammer
• (1Hour 30Min)$desc$),
      ('598c88c9-af8b-47b4-a22f-b2af1a905cfd', $desc$•	Cleanse
•	Black Carbon Mask
•	Pre-Peel
•	Clarity Booster
•	Gentle Exfoliation Mask
•	Blue Photon Light 10min
•	Cell Recovery
•	HF
•	Acne Day SPF30
•	Sun Cream SPF50
•	Cold Hammer
•	(1H 30Min)$desc$),
      ('975999ce-a6cc-45c4-a0ed-9f4de0f3ec5b', $desc$•	Cleanse
•	Pre Peel
•	Brightening Booster
•	Red Photon Light 10 min
•	Anti-Ageing Mask
•	VHC Over mask
•	Ultrasound 10Min
•	GF Serum
•	Red Photon light 10Min
•	Cell Recovery
•	Manual Massage
•	RF 10Min
•	Mechanical Massage
•	Hyaluronic Spray
•	Day Cream SPF30
•	Cold Hammer
•	(1H30Min)$desc$),
      ('71d29944-2474-4034-a232-5b14503c5eda', $desc$•	Cleanse
•	Pre-Peel
•	Anti-Ageing Mask
•	RF
•	GF Serum
•	Anti-Ageing Serum
•	Cell Recovery
•	Ultrasound
•	Massage
•	Hyaluronic Spray
•	Day Cream SPF30
•	Red Photon light 10Min
•	(1h30)$desc$),
      ('a5af84f7-e1d3-4e5f-afef-a1e7a26e4caa', $desc$•	Cleanse
•	Pre Peel
•	Brightening Booster
•	Nano Needle Booster
•	Anti-Ageing Mask
•	Ultrasound 10Min
•	RF 10 Min
•	Needle Fotox in Targeted Areas
•	Red Photon Light 10Min
•	Cell Recovery
•	RF 10min
•	Manual Massage
•	Hyaluronic Spray
•	HF 10Min
•	Day Cream SPF30
•	Sun Cream
•	Cold Hammer
•	(2Hours)$desc$),
      ('29a37095-3263-4ce2-a3b5-2b6525804de5', $desc$•⁠  ⁠Cleanse
•⁠  ⁠Pre-Peel
•⁠  ⁠Nano needle Brightening booster
•⁠  ⁠Anti-ageing mask
•⁠  ⁠Ultrasound 5min
•⁠  ⁠GF Serum
•⁠  ⁠Anti-Ageing Serum
•⁠  ⁠Nano Needle Fotox Target Areas
•⁠  ⁠Mechanical Massage
•⁠  ⁠Hyaluronic Spray
•⁠  ⁠Day Cream SPF30
•⁠  ⁠Sun Cream SPF50
•⁠  ⁠Cold Hammer
•⁠  ⁠(1Hour 30Min)$desc$),
      ('f3e682e1-6a03-4623-83e6-935752b27196', $desc$1.⁠ ⁠Lip Liner – (Permanent)
1st Treatment – R1700 (2H00)
Touch up – R1650 (2H00)
2.⁠ ⁠Full Lip plus liner – (Permanent)
          1st Treatment – R2750 (3H00)
           Touch up – R2700 (3H00)

3.⁠ ⁠Ombre Lips – (Permanent)
           1st Treatment – R2900 (3H00)
            Touchup – R2850 (3H00)$desc$),
      ('7537cf00-0777-44a0-a04a-ce2ff3fbf2a6', $desc$Post Reconstructive Surgery –
Consultation R400 (30Min)
Price on Quotation.$desc$),
      ('175c91c9-562e-4aa7-87eb-8f918462ce7f', $desc$Brow wax – R80 (15min)
Brow Tint – R80 (15Min)
Lip Wax Upper – R80 (15Min)
Lip Wax Bottom – R80 (15Min)
Bottom Lip & Chin Wax R120 (20Min)
Full Face Wax – R500 (1H00)$desc$),
      ('3f92913f-e670-4a75-8f0a-fc2d9d401eb5', $desc$1.	Thin line Top & bottom – (Permanent)
       1st Treatment – R2000 (3H00)
        Touch up – R2150 (2H00)
2.	Thick line Top – (Permanent)
       1st Treatment – R2100 (3H00)
        Touch up – R2150 (2H00)
3.	Winged Top – (Permanent)
        1st Treatment - R2200 (3h00)
        Touch up – R2150 (2H00)
4.	Top line only –(Permanent)
        1st Treatment – R1300 (2H00)
         Touch up – R1250 (2H00)$desc$),
      ('cf51772d-9dbc-48c4-98d4-4fbc50fefbde', $desc$Permanent Makeup - Brows: 
1.	Microblading (Semi Permanent)
      1st Treatment - R2000 (3H00)
               Touch up – R 1950 (2Hours)

2.	Shaded Brows (Permanent) 
        1st Treatment – R2000 (3h00)
        Touch up – R1950 (2Hours)

3.	Microblade/Shaded Combined (Permanent)
        1st Treatment – R2200 (3h00)
        Touch up – R2150 (2H00)$desc$)
  )
  SELECT COUNT(*) INTO v_target_count
    FROM services s
    JOIN approved a ON a.external_id = s.external_id
   WHERE s.external_source = 'goldie';

  IF v_target_count <> 20 THEN
    RAISE EXCEPTION 'Goldie Wave A target cardinality mismatch: expected 20 canonical rows, found %', v_target_count;
  END IF;

  WITH approved(external_id, description) AS (
    VALUES
      ('082a3806-3b46-4469-88b8-68b5df95e82b', $desc$•⁠  ⁠Cleanse
•⁠  ⁠Pre-Peel
•⁠  ⁠Clarity Booster
•⁠  ⁠Needling with Booster
•⁠  ⁠Anti-Ageing Mask
•⁠  ⁠Ultrasound 5Min
•⁠  ⁠GF Serum needling
•⁠  ⁠Blue Photon lights 10min
•⁠  ⁠Cell recovery
•⁠  ⁠RF 8min
•⁠  ⁠High Frequency
•⁠  ⁠Acne Day Cream
•⁠  ⁠Sun Cream SPF50
•⁠  ⁠Cold Hammer
•⁠  ⁠(1Hour 30Min)$desc$),
      ('592f0d7d-5a54-4f01-a7ee-c10fb0715140', $desc$Acne Congested/Hormonal Break out skin:
•⁠  ⁠Cleanse
•⁠  ⁠Exfoliate- Micro Peel  
•⁠  ⁠Gentle Exfoliation Mask
•⁠  ⁠Growth Factor Serum
•⁠  ⁠Cell Recovery/ High Frequincy
•⁠  ⁠Formulage Eye Cream, Acne Day Cream & Sun Cream SPF30 – 
•⁠  ⁠Blue LED photon light therapy 10min 
•⁠  ⁠(1Hour )$desc$),
      ('1c7cdc7c-67b2-4c44-b999-1b900d27ca3c', $desc$•⁠  ⁠Cleanse
•⁠  ⁠Mechanical vellus hair removal
•⁠  ⁠Exfoliate
•⁠  ⁠Gentle Exfoliation Mask or Anti-ageing mask
•⁠  ⁠Growth Factor Serum or Anti-ageing serum
•⁠  ⁠Cell Recovery/Radio frequency or Ultrasound
•⁠  ⁠Massage
•⁠  ⁠Formulage Eye cream, Day cream & Sun Cream SPF30 
•⁠  ⁠Red Photon Light Therapy 10Min.
•⁠  ⁠(1Hour 30Min)$desc$),
      ('8caf9baa-c5b0-4b8a-b45e-b10ca2367c50', $desc$•⁠  ⁠Cleanse
•⁠  ⁠Exfoliate
•⁠  ⁠Anti-ageing mask
•⁠  ⁠Growth Factor Serum or Anti-ageing serum
•⁠  ⁠Cell Recovery/Radio frequency or Ultrasound
•⁠  ⁠Massage
•⁠  ⁠Formulage Eye cream, Day cream & Sun Cream SPF30  
•⁠  ⁠Red Photon Light Therapy 10Min
•	 (1 Hour 30 min)$desc$),
      ('3a5d1f78-4213-401a-b279-e674608c5c5b', $desc$⁠Cleanse
•⁠  ⁠Pre Peel & Clarity Booster
•⁠  ⁠Anti-ageing mask or Gentle exfoliation Mask
•⁠  ⁠Growth Factor Serum or Anti-ageing serum
•⁠  ⁠Cell Recovery & High Frequency
•⁠  ⁠Massage
•⁠  ⁠Formulage Eye cream, Day cream & Sun Cream SPF30  
•⁠  ⁠Red Photon Light Therapy 10Min
1h30min$desc$),
      ('178ff19a-a260-4915-af76-09c4f6884c39', $desc$•⁠  ⁠Cleanse
•⁠  ⁠Pre-Peel
•⁠  ⁠Brightening Booster 
•⁠  ⁠20% Glycolic Peel
•⁠  ⁠Neutralizer
•⁠  ⁠Anti-ageing Mask
•⁠  ⁠GF Serum
•⁠  ⁠Anti-Ageing Serum
•⁠  ⁠Cell Recovery
•⁠  ⁠Manual Massage


•⁠  ⁠Mechanical Massage
•⁠  ⁠Hyaluronic Spray
•⁠  ⁠Eye Cream
•⁠  ⁠Day Cream SPF30
•⁠  ⁠SPF50
•⁠  ⁠(1Hour 30min)$desc$),
      ('ca73086c-7a7a-47f8-90e4-992dfc8dd040', $desc$•⁠  ⁠Cleanse 
•⁠  ⁠Gentle Exfoliation Mask
•⁠  ⁠Blue Photon light 10min
•⁠  ⁠Anti-Ageing Mask
•⁠  ⁠GF Serum
•⁠  ⁠Cell Recovery
•⁠  ⁠Ultrasound 10min.
•⁠  ⁠Cell Recovery
•⁠  ⁠Manual Massage
•⁠  ⁠High Frequency
•⁠  ⁠Acne Day Cream
•⁠  ⁠Sun Cream SPF50
•⁠  ⁠Cold Hammer
•⁠  ⁠(1Hour 30min.)$desc$),
      ('d2adf221-5d19-43ff-bd7b-281aa21b2428', $desc$•⁠  ⁠Cleanse
•⁠  ⁠Exfoliation Mask
•⁠  ⁠Red Photon Light 10Min
•⁠  ⁠Anti-Ageing Mask
•⁠  ⁠VHC Serum
•⁠  ⁠5 Min RF
•⁠  ⁠Spade Removal
•⁠  ⁠Cell Recovery
•⁠  ⁠RF
•⁠  ⁠Massage
•⁠  ⁠Hyaluronic Spray
•⁠  ⁠HF
•⁠  ⁠Day Cream SPF30
•⁠  ⁠Sun Cream SPF50
•⁠  ⁠Cold Hammer
•⁠  ⁠1Hour 30min$desc$),
      ('f87d46dc-f525-409e-beb2-784c56769ae6', $desc$•	Cleanse
•	Pre-Peel
•	Brightening Booster
•	20% Glycolic Peel
•	Neutralize
•	Anti-ageing Mask
•	GF Serum
•	Anti-Ageing Serum
•	Cell Recovery.
•	RF
•	Hyaluronic Spray
•	HF
•	Red Photon light
•	Day Cream SPF30
•	Sun Cream SPF50
•	Cold Hammer
•	(1H30)$desc$),
      ('0dd673be-ab70-4694-8727-08debcae60b5', $desc$• Cleanse
• Pre-Peel
• Brightening Booster
• Hot Hammer 10min
• Anti-Ageing Mask
• GF Serum
• Cell Recovery
• RF Lifting 10Min
• Ultrasound
• Manual Massage
• Hyaluronic Spray
• HF
• Eye Cream
• Day Cream SPF30
• Sun Cream SPF50
• Cold Hammer
• (1Hour 30Min)$desc$),
      ('598c88c9-af8b-47b4-a22f-b2af1a905cfd', $desc$•	Cleanse
•	Black Carbon Mask
•	Pre-Peel
•	Clarity Booster
•	Gentle Exfoliation Mask
•	Blue Photon Light 10min
•	Cell Recovery
•	HF
•	Acne Day SPF30
•	Sun Cream SPF50
•	Cold Hammer
•	(1H 30Min)$desc$),
      ('975999ce-a6cc-45c4-a0ed-9f4de0f3ec5b', $desc$•	Cleanse
•	Pre Peel
•	Brightening Booster
•	Red Photon Light 10 min
•	Anti-Ageing Mask
•	VHC Over mask
•	Ultrasound 10Min
•	GF Serum
•	Red Photon light 10Min
•	Cell Recovery
•	Manual Massage
•	RF 10Min
•	Mechanical Massage
•	Hyaluronic Spray
•	Day Cream SPF30
•	Cold Hammer
•	(1H30Min)$desc$),
      ('71d29944-2474-4034-a232-5b14503c5eda', $desc$•	Cleanse
•	Pre-Peel
•	Anti-Ageing Mask
•	RF
•	GF Serum
•	Anti-Ageing Serum
•	Cell Recovery
•	Ultrasound
•	Massage
•	Hyaluronic Spray
•	Day Cream SPF30
•	Red Photon light 10Min
•	(1h30)$desc$),
      ('a5af84f7-e1d3-4e5f-afef-a1e7a26e4caa', $desc$•	Cleanse
•	Pre Peel
•	Brightening Booster
•	Nano Needle Booster
•	Anti-Ageing Mask
•	Ultrasound 10Min
•	RF 10 Min
•	Needle Fotox in Targeted Areas
•	Red Photon Light 10Min
•	Cell Recovery
•	RF 10min
•	Manual Massage
•	Hyaluronic Spray
•	HF 10Min
•	Day Cream SPF30
•	Sun Cream
•	Cold Hammer
•	(2Hours)$desc$),
      ('29a37095-3263-4ce2-a3b5-2b6525804de5', $desc$•⁠  ⁠Cleanse
•⁠  ⁠Pre-Peel
•⁠  ⁠Nano needle Brightening booster
•⁠  ⁠Anti-ageing mask
•⁠  ⁠Ultrasound 5min
•⁠  ⁠GF Serum
•⁠  ⁠Anti-Ageing Serum
•⁠  ⁠Nano Needle Fotox Target Areas
•⁠  ⁠Mechanical Massage
•⁠  ⁠Hyaluronic Spray
•⁠  ⁠Day Cream SPF30
•⁠  ⁠Sun Cream SPF50
•⁠  ⁠Cold Hammer
•⁠  ⁠(1Hour 30Min)$desc$),
      ('f3e682e1-6a03-4623-83e6-935752b27196', $desc$1.⁠ ⁠Lip Liner – (Permanent)
1st Treatment – R1700 (2H00)
Touch up – R1650 (2H00)
2.⁠ ⁠Full Lip plus liner – (Permanent)
          1st Treatment – R2750 (3H00)
           Touch up – R2700 (3H00)

3.⁠ ⁠Ombre Lips – (Permanent)
           1st Treatment – R2900 (3H00)
            Touchup – R2850 (3H00)$desc$),
      ('7537cf00-0777-44a0-a04a-ce2ff3fbf2a6', $desc$Post Reconstructive Surgery –
Consultation R400 (30Min)
Price on Quotation.$desc$),
      ('175c91c9-562e-4aa7-87eb-8f918462ce7f', $desc$Brow wax – R80 (15min)
Brow Tint – R80 (15Min)
Lip Wax Upper – R80 (15Min)
Lip Wax Bottom – R80 (15Min)
Bottom Lip & Chin Wax R120 (20Min)
Full Face Wax – R500 (1H00)$desc$),
      ('3f92913f-e670-4a75-8f0a-fc2d9d401eb5', $desc$1.	Thin line Top & bottom – (Permanent)
       1st Treatment – R2000 (3H00)
        Touch up – R2150 (2H00)
2.	Thick line Top – (Permanent)
       1st Treatment – R2100 (3H00)
        Touch up – R2150 (2H00)
3.	Winged Top – (Permanent)
        1st Treatment - R2200 (3h00)
        Touch up – R2150 (2H00)
4.	Top line only –(Permanent)
        1st Treatment – R1300 (2H00)
         Touch up – R1250 (2H00)$desc$),
      ('cf51772d-9dbc-48c4-98d4-4fbc50fefbde', $desc$Permanent Makeup - Brows: 
1.	Microblading (Semi Permanent)
      1st Treatment - R2000 (3H00)
               Touch up – R 1950 (2Hours)

2.	Shaded Brows (Permanent) 
        1st Treatment – R2000 (3h00)
        Touch up – R1950 (2Hours)

3.	Microblade/Shaded Combined (Permanent)
        1st Treatment – R2200 (3h00)
        Touch up – R2150 (2H00)$desc$)
  )
  UPDATE services s
     SET customer_description = a.description,
         updated_at = NOW()
    FROM approved a
   WHERE s.external_source = 'goldie'
     AND s.external_id = a.external_id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  IF v_updated_count <> 20 THEN
    RAISE EXCEPTION 'Goldie Wave A update cardinality mismatch: expected 20 rows, updated %', v_updated_count;
  END IF;
END
$wave_a$;
