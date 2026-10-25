// Mirrors backend/src/constants.js. Values are what the API stores; labels are for display.

export const CATEGORIES = [
  {
    value: "planner",
    label: "Event Planner",
    description: "Someone to plan, coordinate and manage vendors for your event.",
    icon: "🗂️",
  },
  {
    value: "performer",
    label: "Performer",
    description: "Singers, bands, DJs, dancers, comedians, anchors and more.",
    icon: "🎤",
  },
  {
    value: "crew",
    label: "Crew",
    description: "Photographers, sound & lighting techs, security, staff.",
    icon: "🎬",
  },
] as const;

export type Category = (typeof CATEGORIES)[number]["value"];

export const EVENT_TYPES = [
  { value: "wedding", label: "Wedding" },
  { value: "corporate", label: "Corporate event" },
  { value: "birthday", label: "Birthday" },
  { value: "concert", label: "Concert" },
  { value: "conference", label: "Conference" },
  { value: "festival", label: "Festival" },
  { value: "private_party", label: "Private party" },
  { value: "other", label: "Other" },
];

export const PLANNER_SERVICES = [
  { value: "full_planning", label: "Full event planning" },
  { value: "day_of_coordination", label: "Day-of coordination" },
  { value: "vendor_management", label: "Vendor management" },
  { value: "decor_styling", label: "Décor & styling" },
  { value: "catering_coordination", label: "Catering coordination" },
  { value: "logistics", label: "Logistics & transport" },
  { value: "guest_management", label: "Guest management" },
];

export const PLANNING_STAGES = [
  { value: "just_started", label: "Just started" },
  { value: "venue_booked", label: "Venue booked" },
  { value: "mostly_planned", label: "Mostly planned" },
];

export const PERFORMER_TYPES = [
  { value: "singer", label: "Singer" },
  { value: "band", label: "Band" },
  { value: "dj", label: "DJ" },
  { value: "dancer", label: "Dancer / dance troupe" },
  { value: "comedian", label: "Stand-up comedian" },
  { value: "magician", label: "Magician" },
  { value: "anchor_emcee", label: "Anchor / emcee" },
  { value: "instrumentalist", label: "Instrumentalist" },
  { value: "other", label: "Other" },
];

export const CREW_ROLES = [
  { value: "photographer", label: "Photographer" },
  { value: "videographer", label: "Videographer" },
  { value: "sound_engineer", label: "Sound engineer" },
  { value: "lighting_technician", label: "Lighting technician" },
  { value: "stagehand", label: "Stagehand" },
  { value: "makeup_artist", label: "Makeup artist" },
  { value: "security", label: "Security" },
  { value: "event_staff", label: "Event staff / ushers" },
  { value: "catering_staff", label: "Catering staff" },
];

export const EXPERIENCE_LEVELS = [
  { value: "any", label: "Any experience" },
  { value: "intermediate", label: "Intermediate (2+ years)" },
  { value: "expert", label: "Expert (5+ years)" },
];

const ALL_OPTIONS = [
  ...CATEGORIES,
  ...EVENT_TYPES,
  ...PLANNER_SERVICES,
  ...PLANNING_STAGES,
  ...PERFORMER_TYPES,
  ...CREW_ROLES,
  ...EXPERIENCE_LEVELS,
];

export function labelFor(value: string): string {
  return ALL_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
