# Data Contract (v2)

## Product Contract Goals

- Support event-scoped workflows across couple, planner, vendor, guest, and family roles.
- Preserve trust/explainability for AI-assisted recommendations.
- Enable premium upsell and partner/referral workflows without bolting on separate systems.
- Stay lean: compatible with managed auth, managed database, and serverless APIs.
- Leverage existing Venue Atlas intelligence instead of rebuilding venue logic.

## Required Metadata for Critical Fields

- value
- source_type
- source_reference
- verified_by
- verified_on
- confidence_score
- review_by

## Security and Tenancy Rules

- Every mutable record must include `event_id`.
- Every user-scoped record must include `member_id` and `role`.
- Every write must capture `created_by`, `updated_by`, and audit timestamps.
- Planner/vendor access should be constrained to assigned events and permitted modules.
- Venue Atlas sourced records must include origin metadata (`atlas_record_id`, `atlas_updated_at`).

## Domain Objects

### Event

- event_id
- event_name
- primary_contact_member_id
- planner_member_id
- venue_id
- event_timezone
- event_dates
- package_tier
- upsell_eligibility

### EventPhase

- phase_id
- event_id
- phase_type (`haldi`, `mehndi`, `sangeet`, `baraat`, `ceremony`, `reception`, `other`)
- scheduled_start
- scheduled_end
- location
- guest_count_estimate
- phase_status

### Membership

- member_id
- event_id
- email
- display_name
- role (`admin`, `couple`, `planner`, `vendor`, `guest`, `family`)
- access_status
- invite_sent_at
- last_login_at

### VendorAssignment

- vendor_assignment_id
- event_id
- vendor_name
- vendor_type
- primary_contact
- scope_of_work
- arrival_window
- load_in_notes
- dependencies
- status

### GuestProfile

- guest_id
- event_id
- household_id
- display_name
- invitation_status
- logistics_notes
- accessibility_notes

### VenueRecord

- venue_id
- venue_name
- atlas_record_id
- atlas_slug
- room_name
- capacity
- sound_constraints
- lighting_constraints
- power_constraints
- load_in_windows
- policy_flags
- trust_metadata

### VenueAtlasRecord

- atlas_record_id
- atlas_slug
- venue_name
- market (`ga-atlanta`, etc.)
- capacity_profile
- baraat_route_notes
- load_in_notes
- decorator_constraints
- av_constraints
- planner_tips
- source_version
- updated_at

### VenueInsightLink

- venue_insight_link_id
- event_id
- venue_id
- atlas_record_id
- link_type (`capacity`, `logistics`, `decor`, `av`, `planner_tip`)
- insight_summary
- confidence_score
- reviewed_by
- reviewed_on

### TimelineItem

- timeline_item_id
- event_id
- phase_id
- owner_role
- owner_member_id
- start_time
- end_time
- title
- status
- blockers
- dependencies

### CoordinationUpdate

- update_id
- event_id
- timeline_item_id
- source_role
- source_member_id
- update_text
- update_type
- requires_ack
- acknowledged_by
- acknowledged_at
- created_at

### AIRecommendation

- recommendation_id
- event_id
- module_name
- recommendation_type
- assumptions
- confidence
- generated_at
- generated_by_model
- escalation_required
- next_best_action
- source_context (`portal`, `venue_atlas`, `manual`)

### TrustMetadata

- trust_metadata_id
- entity_type
- entity_id
- source_type
- source_reference
- reviewed_by
- reviewed_on
- confidence_score
- review_by

### UpsellOpportunity

- upsell_id
- event_id
- phase_id
- trigger_source (`timeline_change`, `venue_constraint`, `guest_count_shift`, `manual`)
- recommendation_summary
- suggested_package
- estimated_value_range
- status (`open`, `presented`, `accepted`, `declined`)
- owner_member_id
- created_at
- originating_recommendation_id
- originating_venue_insight_link_id

### ReferralAttribution

- referral_id
- event_id
- source_type (`planner`, `venue`, `vendor`, `family`, `organic`)
- source_name
- source_contact
- attribution_confidence
- notes

### VenueSEOPage

- venue_seo_page_id
- atlas_record_id
- canonical_slug
- target_keyword_cluster
- service_focus (`dj`, `mc`, `production`, `baraat`, `sangeet`)
- page_status (`draft`, `published`, `refresh_needed`)
- last_reviewed_at

### AuditEvent

- audit_event_id
- event_id
- actor_member_id
- actor_role
- action_type
- entity_type
- entity_id
- before_snapshot
- after_snapshot
- created_at

## Mobile-First Operational Fields

For workflow records used at venues, include:

- `client_generated_at`
- `server_received_at`
- `sync_status`
- `last_synced_at`

These fields support unstable network conditions and conflict analysis.

## Integration Rule: Venue Atlas First

When venue intelligence is needed, modules should use linked `VenueAtlasRecord` data where available.

Priority order:

1. Event-linked Venue Atlas record
2. Verified portal-local venue overrides
3. Manual fallback entry with lower confidence
