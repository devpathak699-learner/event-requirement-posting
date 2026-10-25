// Single source of truth for enum values accepted by the API.
// The frontend mirrors these in frontend/src/lib/options.ts.

export const CATEGORIES = ['planner', 'performer', 'crew'];

export const EVENT_TYPES = [
  'wedding',
  'corporate',
  'birthday',
  'concert',
  'conference',
  'festival',
  'private_party',
  'other',
];

export const PLANNER_SERVICES = [
  'full_planning',
  'day_of_coordination',
  'vendor_management',
  'decor_styling',
  'catering_coordination',
  'logistics',
  'guest_management',
];

export const PERFORMER_TYPES = [
  'singer',
  'band',
  'dj',
  'dancer',
  'comedian',
  'magician',
  'anchor_emcee',
  'instrumentalist',
  'other',
];

export const CREW_ROLES = [
  'photographer',
  'videographer',
  'sound_engineer',
  'lighting_technician',
  'stagehand',
  'makeup_artist',
  'security',
  'event_staff',
  'catering_staff',
];

export const EXPERIENCE_LEVELS = ['any', 'intermediate', 'expert'];
