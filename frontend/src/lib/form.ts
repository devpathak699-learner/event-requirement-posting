import type { Category } from "./options";

// Inputs are kept as strings while editing (so a cleared number field stays
// empty instead of becoming 0) and converted to the API shape in buildPayload.

export type BasicsState = {
  eventName: string;
  eventType: string;
  dateMode: "single" | "range";
  startDate: string;
  endDate: string;
  location: string;
  venue: string;
  category: Category | "";
};

export type PlannerState = {
  services: string[];
  guestCount: string;
  planningStage: string;
  theme: string;
  budgetMin: string;
  budgetMax: string;
  notes: string;
};

export type PerformerState = {
  performerType: string;
  genre: string;
  audienceSize: string;
  performanceDurationMins: string;
  soundSystemProvided: "" | "yes" | "no";
  budgetMin: string;
  budgetMax: string;
  notes: string;
};

export type CrewRoleRow = { role: string; count: string };

export type CrewState = {
  roles: CrewRoleRow[];
  startTime: string;
  endTime: string;
  experienceLevel: string;
  budgetMin: string;
  budgetMax: string;
  notes: string;
};

// Details are stored per category, so switching category in Step 1 and back
// doesn't wipe what the user already typed. Only the selected one is submitted.
export type FormState = {
  basics: BasicsState;
  planner: PlannerState;
  performer: PerformerState;
  crew: CrewState;
};

export const initialFormState: FormState = {
  basics: {
    eventName: "",
    eventType: "",
    dateMode: "single",
    startDate: "",
    endDate: "",
    location: "",
    venue: "",
    category: "",
  },
  planner: {
    services: [],
    guestCount: "",
    planningStage: "",
    theme: "",
    budgetMin: "",
    budgetMax: "",
    notes: "",
  },
  performer: {
    performerType: "",
    genre: "",
    audienceSize: "",
    performanceDurationMins: "",
    soundSystemProvided: "",
    budgetMin: "",
    budgetMax: "",
    notes: "",
  },
  crew: {
    roles: [{ role: "", count: "1" }],
    startTime: "",
    endTime: "",
    experienceLevel: "any",
    budgetMin: "",
    budgetMax: "",
    notes: "",
  },
};

export const STEP_TITLES: Record<Category, [string, string]> = {
  planner: ["Planning scope", "Budget & preferences"],
  performer: ["Performance details", "Logistics & budget"],
  crew: ["Crew roles", "Shift & budget"],
};

export function stepLabels(category: Category | ""): string[] {
  const [two, three] = category ? STEP_TITLES[category] : ["Category details", "More details"];
  return ["Event basics", two, three, "Review & submit"];
}

const toInt = (value: string) => Number.parseInt(value, 10);
const optional = (value: string) => value.trim() || undefined;

export function buildPayload(state: FormState) {
  const { basics } = state;
  const base = {
    eventName: basics.eventName.trim(),
    eventType: basics.eventType,
    startDate: basics.startDate,
    endDate: basics.dateMode === "range" && basics.endDate ? basics.endDate : undefined,
    location: basics.location.trim(),
    venue: optional(basics.venue),
    category: basics.category,
  };

  switch (basics.category) {
    case "planner": {
      const d = state.planner;
      return {
        ...base,
        details: {
          services: d.services,
          guestCount: toInt(d.guestCount),
          planningStage: d.planningStage,
          theme: optional(d.theme),
          budget: { min: toInt(d.budgetMin), max: toInt(d.budgetMax) },
          notes: optional(d.notes),
        },
      };
    }
    case "performer": {
      const d = state.performer;
      return {
        ...base,
        details: {
          performerType: d.performerType,
          genre: optional(d.genre),
          audienceSize: toInt(d.audienceSize),
          performanceDurationMins: toInt(d.performanceDurationMins),
          soundSystemProvided: d.soundSystemProvided === "yes",
          budget: { min: toInt(d.budgetMin), max: toInt(d.budgetMax) },
          notes: optional(d.notes),
        },
      };
    }
    case "crew": {
      const d = state.crew;
      return {
        ...base,
        details: {
          roles: d.roles.map((r) => ({ role: r.role, count: toInt(r.count) })),
          shift: { startTime: d.startTime, endTime: d.endTime },
          experienceLevel: d.experienceLevel,
          budget: { min: toInt(d.budgetMin), max: toInt(d.budgetMax) },
          notes: optional(d.notes),
        },
      };
    }
    default:
      throw new Error("Cannot build a payload without a category");
  }
}
