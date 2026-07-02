-- Gwinnett County corridor venue expansion
-- Source: Gemini Deep Research report "Strategic Analysis of Wedding Reception Venues in the
-- Gwinnett County Corridor" (Duluth/Johns Creek/Norcross/Suwanee/Lawrenceville/Buford/Braselton),
-- cross-checked against an independent Claude deep-research pass on the same corridor.
--
-- Excluded from this batch:
--   - Chateau Elan Winery & Resort: already exists in venues as 'Chateau Elan' (Braselton)
--
-- Flagged, inserted with source_confidence='estimated' rather than 'sales_claim':
--   - Hashemite's Banquet Hall: capacity claims (1500/450) were explicitly REFUTED 0-3 twice in an
--     independent adversarial verification pass. Treat capacity as unconfirmed.
--   - Atlanta Banquets (Suwanee): a 450-guest capacity claim was explicitly REFUTED 0-2 in the
--     same independent pass.
--   - Signature Ballroom (Suwanee): source report listed 'N/A' for its citation URL -- no
--     verifiable source at all.
--
-- Two conflicts flagged during initial synthesis, since resolved via a follow-up research turn:
--   - '4675 River Green/Rivergreen Pkwy, Duluth' was reported by Gemini as 'KTN Ballroom' and,
--     separately, by an independent Claude deep-research pass as 'Jade Banquets'. Confirmed via
--     follow-up: same venue, different operating names across branding phases. Inserted as
--     'jade_banquets_duluth', the name carrying the richer, independently-verified data.
--   - Baradari Banquet Hall's originally-reported address (5675 Jimmy Carter Blvd) was confirmed
--     via follow-up to actually belong to Ashiana Banquet Hall (Norcross) -- a copy-paste error in
--     the source report, not a shared building. Baradari is real and distinct (Lawrenceville), but
--     its correct address is unknown; left null rather than guessed, and confidence downgraded to
--     'estimated' since part of its original sourcing was demonstrably wrong.

insert into venues (
  atlas_record_id,
  atlas_slug,
  name,
  room_name,
  city,
  state,
  address,
  length_ft,
  width_ft,
  height_ft,
  marketed_capacity,
  comfortable_range_min,
  comfortable_range_max,
  source_confidence,
  verification_status,
  last_verified_on,
  provenance,
  source_links,
  diagram_assets
)
values
(
  'breckinridge_banquet_hall',
  'breckinridge_banquet_hall',
  'Breckinridge Banquet Hall',
  'Second Floor Ballroom',
  'Duluth',
  'GA',
  '3064 Old Norcross Rd, Duluth, GA',
  null,
  null,
  null,
  200,
  null,
  null,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://breckinridgeevent.com"]'::jsonb,
  '[]'::jsonb
),
(
  'premier_event_halls',
  'premier_event_halls',
  'Premier Event Halls',
  'Emerald Hall',
  'Duluth',
  'GA',
  '3520 Breckinridge Blvd, Duluth, GA',
  null,
  null,
  null,
  350,
  null,
  null,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://premiereventhalls.com"]'::jsonb,
  '[]'::jsonb
),
(
  'hashemites_banquet_hall',
  'hashemites_banquet_hall',
  'Hashemite''s Banquet Hall',
  'The Grand Hall',
  'Duluth',
  'GA',
  '3370 Venture Parkway NW, Duluth, GA',
  null,
  null,
  null,
  1500,
  null,
  450,
  'estimated'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": "FLAG: CONFLICT: independent deep-research pass explicitly refuted capacity claims for this venue (0-3 vote twice) \u2014 treat capacity as unconfirmed, not sales_claim"}'::jsonb,
  '["https://weddingwire.com"]'::jsonb,
  '[]'::jsonb
),
(
  'sonesta_gwinnett_place',
  'sonesta_gwinnett_place',
  'Sonesta Gwinnett Place Atlanta',
  'Georgia Ballroom',
  'Duluth',
  'GA',
  '1775 Pleasant Hill Road, Duluth, GA',
  null,
  null,
  null,
  1000,
  null,
  600,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://sonesta.com"]'::jsonb,
  '[]'::jsonb
),
(
  'gas_south_convention_center',
  'gas_south_convention_center',
  'Gas South Convention Center (Gwinnett Center)',
  'Tommy Hughes Grand Ballroom',
  'Duluth',
  'GA',
  '6400 Sugarloaf Pkwy, Duluth, GA',
  null,
  null,
  null,
  2000,
  null,
  1000,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://gassouthdistrict.com"]'::jsonb,
  '[]'::jsonb
),
(
  'hudgens_center',
  'hudgens_center',
  'The Hudgens Center for Art & Learning',
  'Grand Hall',
  'Duluth',
  'GA',
  '6400 Sugarloaf Pkwy, Duluth, GA',
  null,
  null,
  null,
  125,
  null,
  100,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://thehudgens.org"]'::jsonb,
  '[]'::jsonb
),
(
  'payne_corley_house',
  'payne_corley_house',
  'Payne-Corley House',
  'Ballroom',
  'Duluth',
  'GA',
  '2987 Main St, Duluth, GA',
  null,
  null,
  null,
  250,
  null,
  155,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://paynecorleyhouse.com"]'::jsonb,
  '[]'::jsonb
),
(
  'st_marlo_country_club',
  'st_marlo_country_club',
  'St. Marlo Country Club',
  'Formal Dining Room',
  'Duluth',
  'GA',
  '7755 Saint Marlo Country Club Pkwy, Duluth, GA',
  null,
  null,
  null,
  150,
  null,
  140,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://weddingwire.com"]'::jsonb,
  '[]'::jsonb
),
(
  'the_1818_club',
  'the_1818_club',
  'The 1818 Club',
  'Virgil Williams Ballroom',
  'Duluth',
  'GA',
  '6500 Sugarloaf Parkway, Duluth, GA',
  null,
  null,
  null,
  225,
  null,
  200,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://the1818club.org"]'::jsonb,
  '[]'::jsonb
),
(
  'berkeley_hills_country_club',
  'berkeley_hills_country_club',
  'Berkeley Hills Country Club',
  'Magnolia Room',
  'Duluth',
  'GA',
  '2300 Pond Road, Duluth, GA',
  null,
  null,
  null,
  250,
  null,
  200,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://weddingwire.com"]'::jsonb,
  '[]'::jsonb
),
(
  'courtyard_duluth_sugarloaf',
  'courtyard_duluth_sugarloaf',
  'Courtyard Atlanta NE/Duluth Sugarloaf',
  'Dogwood Room',
  'Duluth',
  'GA',
  '1948 Satellite Blvd, Duluth, GA',
  null,
  null,
  null,
  75,
  null,
  null,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://exploregwinnett.org"]'::jsonb,
  '[]'::jsonb
),
(
  'embassy_suites_ne_gwinnett',
  'embassy_suites_ne_gwinnett',
  'Embassy Suites by Hilton Atlanta NE Gwinnett Sugarloaf',
  'Chattahoochee Ballroom',
  'Duluth',
  'GA',
  '2029 Satellite Blvd, Duluth, GA',
  null,
  null,
  null,
  300,
  null,
  180,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://hilton.com"]'::jsonb,
  '[]'::jsonb
),
(
  'atlanta_banquets_suwanee',
  'atlanta_banquets_suwanee',
  'Atlanta Banquets',
  'Swarovski Crystal Ballroom',
  'Suwanee',
  'GA',
  '1300 Peachtree Industrial Blvd, Suwanee, GA',
  null,
  null,
  null,
  450,
  null,
  400,
  'estimated'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": "FLAG: Independent deep-research pass explicitly refuted a 450-cap claim for this venue (0-2 vote) \u2014 treat capacity as lower confidence"}'::jsonb,
  '["https://receptionhalls.com"]'::jsonb,
  '[]'::jsonb
),
(
  'genesis_ballroom',
  'genesis_ballroom',
  'Genesis Ballroom',
  'Origin Hall',
  'Suwanee',
  'GA',
  '105 Horizon Dr, Suwanee, GA',
  null,
  null,
  null,
  320,
  null,
  300,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://genesisballroomatl.com"]'::jsonb,
  '[]'::jsonb
),
(
  'grand_ivy_point',
  'grand_ivy_point',
  'The Grand Ivy Point',
  'The Grand Room',
  'Suwanee',
  'GA',
  '302 Satellite Blvd, Suwanee, GA',
  null,
  null,
  null,
  750,
  null,
  450,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://thegrandivypoint.com"]'::jsonb,
  '[]'::jsonb
),
(
  'bears_best_atlanta',
  'bears_best_atlanta',
  'Bear''s Best Atlanta',
  'Masters Ballroom',
  'Suwanee',
  'GA',
  '5342 Aldeburgh Dr, Suwanee, GA',
  null,
  null,
  null,
  250,
  null,
  220,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://invitedclubs.com"]'::jsonb,
  '[]'::jsonb
),
(
  'the_river_club_suwanee',
  'the_river_club_suwanee',
  'The River Club',
  'The Lodge Ballroom',
  'Suwanee',
  'GA',
  '1138 Crescent River Pass, Suwanee, GA',
  null,
  null,
  null,
  200,
  null,
  150,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://theriverclub-ga.com"]'::jsonb,
  '[]'::jsonb
),
(
  'signature_ballroom_suwanee',
  'signature_ballroom_suwanee',
  'Signature Ballroom',
  'Signature Ballroom',
  'Suwanee',
  'GA',
  '80 Horizon Dr, Suwanee, GA',
  null,
  null,
  null,
  400,
  null,
  null,
  'estimated'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": "FLAG: Source URL listed as N/A in report \u2014 lower confidence, no citation to verify against"}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
),
(
  'sankranti_restaurants_banquets',
  'sankranti_restaurants_banquets',
  'Sankranti Restaurants and Banquets',
  'Nagara Ballroom',
  'Johns Creek',
  'GA',
  '2000 Ray Moss Connector, Johns Creek, GA',
  null,
  null,
  null,
  500,
  null,
  450,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": "Directly South-Asian-branded (Indian restaurant + banquet hybrid) \u2014 strong signal match for target clientele"}'::jsonb,
  '["https://sankrantirestaurants.com"]'::jsonb,
  '[]'::jsonb
),
(
  'st_ives_country_club',
  'st_ives_country_club',
  'St Ives Country Club',
  'The Ballroom',
  'Johns Creek',
  'GA',
  '1 St Ives Country Club Dr, Johns Creek, GA',
  null,
  null,
  null,
  250,
  null,
  190,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://stivescountryclub.org"]'::jsonb,
  '[]'::jsonb
),
(
  'the_standard_club',
  'the_standard_club',
  'The Standard Club',
  'Grand Ballroom',
  'Johns Creek',
  'GA',
  '6230 Abbotts Bridge Rd, Johns Creek, GA',
  null,
  null,
  null,
  225,
  null,
  200,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://standardclub.org"]'::jsonb,
  '[]'::jsonb
),
(
  'country_club_of_the_south',
  'country_club_of_the_south',
  'Country Club of the South',
  'Main Ballroom',
  'Johns Creek',
  'GA',
  '4100 Old Alabama Rd, Johns Creek, GA',
  null,
  null,
  null,
  500,
  null,
  275,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://thecountryclubofthesouth.com"]'::jsonb,
  '[]'::jsonb
),
(
  'atlanta_athletic_club',
  'atlanta_athletic_club',
  'Atlanta Athletic Club',
  'Main Ballroom',
  'Johns Creek',
  'GA',
  '1930 Bobby Jones Dr, Johns Creek, GA',
  null,
  null,
  null,
  null,
  null,
  null,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://atlantaathleticclub.org"]'::jsonb,
  '[]'::jsonb
),
(
  'the_atrium_wedgewood',
  'the_atrium_wedgewood',
  'The Atrium by Wedgewood Weddings',
  'The Atrium Ballroom',
  'Norcross',
  'GA',
  '139 North Norcross Tucker Road, Norcross, GA',
  null,
  null,
  null,
  150,
  null,
  null,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://wedgewoodweddings.com"]'::jsonb,
  '[]'::jsonb
),
(
  'flint_hill_wedgewood',
  'flint_hill_wedgewood',
  'Flint Hill by Wedgewood Weddings',
  'Grand Hall',
  'Norcross',
  'GA',
  '539 S Peachtree St, Norcross, GA',
  null,
  null,
  null,
  300,
  null,
  250,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://wedgewoodweddings.com"]'::jsonb,
  '[]'::jsonb
),
(
  '173_carlyle_house',
  '173_carlyle_house',
  '173 Carlyle House',
  'The Grand Ballroom',
  'Norcross',
  'GA',
  '173 South Peachtree Street, Norcross, GA',
  null,
  null,
  null,
  550,
  null,
  300,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://173carlylehouse.com"]'::jsonb,
  '[]'::jsonb
),
(
  'crowne_plaza_norcross',
  'crowne_plaza_norcross',
  'Crowne Plaza Atlanta - Norcross',
  'Richmond Grand Ballroom',
  'Norcross',
  'GA',
  '6050 Peachtree Industrial Boulevard, Norcross, GA',
  null,
  null,
  null,
  800,
  null,
  480,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://ihg.com"]'::jsonb,
  '[]'::jsonb
),
(
  'royal_ballroom_norcross',
  'royal_ballroom_norcross',
  'Royal Ballroom',
  'Royal Ballroom',
  'Norcross',
  'GA',
  '6185 Buford Highway, C2, Norcross, GA',
  null,
  null,
  null,
  450,
  null,
  null,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://weddingwire.com"]'::jsonb,
  '[]'::jsonb
),
(
  'ashiana_banquet_hall',
  'ashiana_banquet_hall',
  'Ashiana Banquet Hall & Restaurant',
  'Grand Ballroom',
  'Norcross',
  'GA',
  '5675 Jimmy Carter Blvd, Norcross, GA',
  null,
  null,
  null,
  1000,
  null,
  700,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": "Directly South-Asian-branded, located in Global Mall \u2014 institutional pillar for the South Asian community per report"}'::jsonb,
  '["https://theashiana.net"]'::jsonb,
  '[]'::jsonb
),
(
  'vip_event_hall_lawrenceville',
  'vip_event_hall_lawrenceville',
  'VIP Event Hall',
  'VIP Event Hall',
  'Lawrenceville',
  'GA',
  '884 Buford Dr Suite 1000, Lawrenceville, GA',
  null,
  null,
  null,
  270,
  null,
  250,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://exploregwinnett.org"]'::jsonb,
  '[]'::jsonb
),
(
  'grand_palais_banquet_hall',
  'grand_palais_banquet_hall',
  'Grand Palais Banquet Hall',
  'Grand Palais Ballroom',
  'Lawrenceville',
  'GA',
  '3540 Club Drive, Lawrenceville, GA',
  null,
  null,
  null,
  400,
  null,
  null,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://wedding-spot.com"]'::jsonb,
  '[]'::jsonb
),
(
  'the_opal_event_hall',
  'the_opal_event_hall',
  'The Opal Event Hall',
  'Main Hall',
  'Lawrenceville',
  'GA',
  '1848 Old Norcross Road, Lawrenceville, GA',
  null,
  null,
  null,
  400,
  null,
  300,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://opaleventhall.com"]'::jsonb,
  '[]'::jsonb
),
(
  'baradari_banquet_hall',
  'baradari_banquet_hall',
  'Baradari Banquet Hall',
  'Main Banquet Hall',
  'Lawrenceville',
  'GA',
  null,
  null,
  null,
  null,
  350,
  null,
  300,
  'estimated'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": "RESOLVED: the street address originally reported (5675 Jimmy Carter Blvd) was confirmed to actually belong to Ashiana Banquet Hall (Norcross), not this venue -- likely copy-paste error in the source report. Baradari is a real, distinct venue in Lawrenceville, but its correct street address is unknown; left null rather than guessed. Confidence downgraded to estimated since part of the original sourcing was demonstrably wrong."}'::jsonb,
  '["https://baradaribanquet.com"]'::jsonb,
  '[]'::jsonb
),
(
  'jade_banquets_duluth',
  'jade_banquets_duluth',
  'Jade Banquets',
  'Main Ball Room',
  'Duluth',
  'GA',
  '4675 Rivergreen Pkwy, Duluth, GA',
  null,
  null,
  null,
  500,
  null,
  450,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "claude_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": "RESOLVED: this address (4675 River Green / Rivergreen Pkwy, Duluth) was independently found under two names -- Gemini reported it as ''KTN Ballroom'' (no distinguished capacity), an independent Claude deep-research pass found it as ''Jade Banquets'' with adversarially-verified capacity (500 max / 450 Main Ball Room) and an explicit outside-catering-allowed disclosure. Gemini confirmed via follow-up these are the same venue across different branding/operating-name phases. Jade Banquets used as the primary name since it carries the richer, independently-verified data; may also be listed as KTN Ballroom."}'::jsonb,
  '["https://www.eventective.com/duluth-ga/jade-banquets-758179.html"]'::jsonb,
  '[]'::jsonb
),
(
  'gwinnett_historic_courthouse',
  'gwinnett_historic_courthouse',
  'Gwinnett Historic Courthouse',
  'Superior Court Ballroom',
  'Lawrenceville',
  'GA',
  '185 West Crogan Street, Lawrenceville, GA',
  null,
  null,
  null,
  400,
  null,
  200,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": "County-owned/operated venue"}'::jsonb,
  '["https://gwinnettcounty.com"]'::jsonb,
  '[]'::jsonb
),
(
  'natalie_house_wedgewood',
  'natalie_house_wedgewood',
  'Natalie House by Wedgewood Weddings',
  'Main Ballroom',
  'Lawrenceville',
  'GA',
  '3571 Lawrenceville Hwy, Lawrenceville, GA',
  null,
  null,
  null,
  300,
  null,
  250,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://wedgewoodweddings.com"]'::jsonb,
  '[]'::jsonb
),
(
  'buford_community_center',
  'buford_community_center',
  'Buford Community Center',
  'Phillip Beard Ballroom',
  'Buford',
  'GA',
  '2200 Buford Hwy NE, Buford, GA',
  null,
  null,
  null,
  300,
  null,
  275,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://bufordcommunitycenter.com"]'::jsonb,
  '[]'::jsonb
),
(
  'lanier_islands_legacy_lodge',
  'lanier_islands_legacy_lodge',
  'Lanier Islands Resort - Legacy Lodge',
  'Peachtree Pointe / Grand Ballroom A-D',
  'Buford',
  'GA',
  '7000 Lanier Islands Parkway, Buford, GA',
  null,
  null,
  null,
  701,
  null,
  470,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://lanierislands.com"]'::jsonb,
  '[]'::jsonb
),
(
  'ashton_gardens_atlanta',
  'ashton_gardens_atlanta',
  'Ashton Gardens Atlanta',
  'Grand Ballroom',
  'Sugar Hill',
  'GA',
  '260 Peachtree Industrial Blvd, Sugar Hill, GA',
  null,
  null,
  null,
  300,
  null,
  null,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://waltersweddingestates.com"]'::jsonb,
  '[]'::jsonb
),
(
  'one_seventy_main',
  'one_seventy_main',
  'One Seventy Main',
  'Main Ballroom',
  'Buford',
  'GA',
  '170 West Main St, Buford, GA',
  null,
  null,
  null,
  150,
  null,
  90,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://oneseventymain.com"]'::jsonb,
  '[]'::jsonb
),
(
  'gwinnett_env_heritage_center',
  'gwinnett_env_heritage_center',
  'Gwinnett Environmental & Heritage Center',
  'Blue Planet Room',
  'Buford',
  'GA',
  '2020 Clean Water Dr, Buford, GA',
  null,
  null,
  null,
  375,
  null,
  225,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://gwinnettehc.org"]'::jsonb,
  '[]'::jsonb
),
(
  'vecoma_yellow_river',
  'vecoma_yellow_river',
  'Vecoma at the Yellow River',
  'Main Reception Hall',
  'Snellville',
  'GA',
  '4400 Vecoma Ln, Snellville, GA',
  null,
  null,
  null,
  320,
  null,
  250,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://vecoma1.com"]'::jsonb,
  '[]'::jsonb
),
(
  'vines_mansion',
  'vines_mansion',
  'Vines Mansion',
  'Swan Lake Chapel / Arbor Patio',
  'Loganville',
  'GA',
  '3500 Oak Grove Rd SW, Loganville, GA',
  null,
  null,
  null,
  500,
  null,
  300,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": null}'::jsonb,
  '["https://cvent.com"]'::jsonb,
  '[]'::jsonb
),
(
  'carl_house',
  'carl_house',
  'Carl House',
  'The Grand Ballroom',
  'Auburn',
  'GA',
  '1176 Atlanta Highway, Auburn, GA',
  null,
  null,
  null,
  280,
  null,
  220,
  'sales_claim'::confidence_level,
  'unverified'::verification_status,
  '2026-07-02',
  '{"source": "gemini_deep_research", "fieldSources": {}, "floorPlanType": null, "floorPlanNotes": null, "floorPlanLastVerified": null, "capacityNotes": "220 buffet / 135 plated \u2014 buffet figure used as seated capacity"}'::jsonb,
  '["https://carlhouse.com"]'::jsonb,
  '[]'::jsonb
)
;

-- Policy facts (venue_constraints) sourced directly from the same report where explicitly stated.
insert into venue_constraints (
  venue_id, category, key, value_text, value_number, value_boolean, unit, notes,
  source_confidence, source_reference, reviewed_on
)
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, true, null, 'yes_no_fee', 'sales_claim'::confidence_level, 'https://breckinridgeevent.com', '2026-07-02'
from venues v where v.atlas_record_id = 'breckinridge_banquet_hall'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, false, null, 'in_house', 'sales_claim'::confidence_level, 'https://premiereventhalls.com', '2026-07-02'
from venues v where v.atlas_record_id = 'premier_event_halls'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, true, null, 'yes_outside_vendors', 'estimated'::confidence_level, 'https://weddingwire.com', '2026-07-02'
from venues v where v.atlas_record_id = 'hashemites_banquet_hall'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, false, null, 'in_house', 'sales_claim'::confidence_level, 'https://sonesta.com', '2026-07-02'
from venues v where v.atlas_record_id = 'sonesta_gwinnett_place'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, false, null, 'no_outside_food', 'sales_claim'::confidence_level, 'https://paynecorleyhouse.com', '2026-07-02'
from venues v where v.atlas_record_id = 'payne_corley_house'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, false, null, 'in_house', 'sales_claim'::confidence_level, 'https://weddingwire.com', '2026-07-02'
from venues v where v.atlas_record_id = 'st_marlo_country_club'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, false, null, 'in_house_required', 'sales_claim'::confidence_level, 'https://the1818club.org', '2026-07-02'
from venues v where v.atlas_record_id = 'the_1818_club'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, false, null, 'in_house_required', 'sales_claim'::confidence_level, 'https://weddingwire.com', '2026-07-02'
from venues v where v.atlas_record_id = 'berkeley_hills_country_club'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, true, null, 'yes', 'estimated'::confidence_level, 'https://receptionhalls.com', '2026-07-02'
from venues v where v.atlas_record_id = 'atlanta_banquets_suwanee'
union all
select v.venue_id, 'policy', 'curfew_time', '9:00 PM (alcohol license; extension available)', null, null, null, 'Alcohol-service license cutoff, not necessarily a hard event-end curfew', 'estimated'::confidence_level, 'https://receptionhalls.com', '2026-07-02'
from venues v where v.atlas_record_id = 'atlanta_banquets_suwanee'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, true, null, 'yes_byo', 'sales_claim'::confidence_level, 'https://genesisballroomatl.com', '2026-07-02'
from venues v where v.atlas_record_id = 'genesis_ballroom'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, true, null, 'yes', 'sales_claim'::confidence_level, 'https://thegrandivypoint.com', '2026-07-02'
from venues v where v.atlas_record_id = 'grand_ivy_point'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, false, null, 'in_house', 'sales_claim'::confidence_level, 'https://invitedclubs.com', '2026-07-02'
from venues v where v.atlas_record_id = 'bears_best_atlanta'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, true, null, 'yes', 'sales_claim'::confidence_level, 'https://sankrantirestaurants.com', '2026-07-02'
from venues v where v.atlas_record_id = 'sankranti_restaurants_banquets'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, false, null, 'no_full_service', 'sales_claim'::confidence_level, 'https://stivescountryclub.org', '2026-07-02'
from venues v where v.atlas_record_id = 'st_ives_country_club'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, true, null, 'yes', 'sales_claim'::confidence_level, 'https://standardclub.org', '2026-07-02'
from venues v where v.atlas_record_id = 'the_standard_club'
union all
select v.venue_id, 'policy', 'open_flame_allowed', null, null, true, null, 'Candle only, inside hurricane glass/globe -- not open flame', 'sales_claim'::confidence_level, 'https://standardclub.org', '2026-07-02'
from venues v where v.atlas_record_id = 'the_standard_club'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, false, null, 'in_house_required', 'sales_claim'::confidence_level, 'https://thecountryclubofthesouth.com', '2026-07-02'
from venues v where v.atlas_record_id = 'country_club_of_the_south'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, false, null, 'in_house_required', 'sales_claim'::confidence_level, 'https://atlantaathleticclub.org', '2026-07-02'
from venues v where v.atlas_record_id = 'atlanta_athletic_club'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, false, null, 'in_house_required', 'sales_claim'::confidence_level, 'https://wedgewoodweddings.com', '2026-07-02'
from venues v where v.atlas_record_id = 'the_atrium_wedgewood'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, false, null, 'in_house_required', 'sales_claim'::confidence_level, 'https://wedgewoodweddings.com', '2026-07-02'
from venues v where v.atlas_record_id = 'flint_hill_wedgewood'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, false, null, 'in_house_required', 'sales_claim'::confidence_level, 'https://173carlylehouse.com', '2026-07-02'
from venues v where v.atlas_record_id = '173_carlyle_house'
union all
select v.venue_id, 'policy', 'open_flame_allowed', null, null, true, null, 'Candle only, inside hurricane glass/globe -- not open flame', 'sales_claim'::confidence_level, 'https://173carlylehouse.com', '2026-07-02'
from venues v where v.atlas_record_id = '173_carlyle_house'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, true, null, 'yes', 'sales_claim'::confidence_level, 'https://ihg.com', '2026-07-02'
from venues v where v.atlas_record_id = 'crowne_plaza_norcross'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, true, null, 'yes_licensed_caterers', 'sales_claim'::confidence_level, 'https://weddingwire.com', '2026-07-02'
from venues v where v.atlas_record_id = 'royal_ballroom_norcross'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, true, null, 'yes_live_cooking', 'sales_claim'::confidence_level, 'https://theashiana.net', '2026-07-02'
from venues v where v.atlas_record_id = 'ashiana_banquet_hall'
union all
select v.venue_id, 'policy', 'open_flame_allowed', null, null, true, null, 'Live tandoor cooking / ceremonial flame allowed with venue approval', 'sales_claim'::confidence_level, 'https://theashiana.net', '2026-07-02'
from venues v where v.atlas_record_id = 'ashiana_banquet_hall'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, true, null, 'yes', 'sales_claim'::confidence_level, 'https://opaleventhall.com', '2026-07-02'
from venues v where v.atlas_record_id = 'the_opal_event_hall'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, true, null, 'yes_byo', 'estimated'::confidence_level, 'https://baradaribanquet.com', '2026-07-02'
from venues v where v.atlas_record_id = 'baradari_banquet_hall'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, true, null, 'Outside Catering Allowed -- explicit disclosure on aggregator listing', 'sales_claim'::confidence_level, 'https://www.eventective.com/duluth-ga/jade-banquets-758179.html', '2026-07-02'
from venues v where v.atlas_record_id = 'jade_banquets_duluth'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, true, null, 'yes', 'sales_claim'::confidence_level, 'https://gwinnettcounty.com', '2026-07-02'
from venues v where v.atlas_record_id = 'gwinnett_historic_courthouse'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, false, null, 'in_house_required', 'sales_claim'::confidence_level, 'https://wedgewoodweddings.com', '2026-07-02'
from venues v where v.atlas_record_id = 'natalie_house_wedgewood'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, true, null, 'yes_approved_list', 'sales_claim'::confidence_level, 'https://bufordcommunitycenter.com', '2026-07-02'
from venues v where v.atlas_record_id = 'buford_community_center'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, true, null, 'yes', 'sales_claim'::confidence_level, 'https://lanierislands.com', '2026-07-02'
from venues v where v.atlas_record_id = 'lanier_islands_legacy_lodge'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, false, null, 'in_house_required', 'sales_claim'::confidence_level, 'https://waltersweddingestates.com', '2026-07-02'
from venues v where v.atlas_record_id = 'ashton_gardens_atlanta'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, true, null, 'yes_preferred_or_byo_fee', 'sales_claim'::confidence_level, 'https://oneseventymain.com', '2026-07-02'
from venues v where v.atlas_record_id = 'one_seventy_main'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, true, null, 'yes', 'sales_claim'::confidence_level, 'https://gwinnettehc.org', '2026-07-02'
from venues v where v.atlas_record_id = 'gwinnett_env_heritage_center'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, false, null, 'in_house_required', 'sales_claim'::confidence_level, 'https://vecoma1.com', '2026-07-02'
from venues v where v.atlas_record_id = 'vecoma_yellow_river'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, true, null, 'yes', 'sales_claim'::confidence_level, 'https://cvent.com', '2026-07-02'
from venues v where v.atlas_record_id = 'vines_mansion'
union all
select v.venue_id, 'policy', 'outside_catering_allowed', null, null, false, null, 'in_house_required', 'sales_claim'::confidence_level, 'https://carlhouse.com', '2026-07-02'
from venues v where v.atlas_record_id = 'carl_house'
;