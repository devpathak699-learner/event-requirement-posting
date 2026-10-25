import type { Category } from "./options";
import type { FormState } from "./form";

// Client-side checks give instant, per-field feedback. The API re-validates
// everything with Zod, so these are a UX layer, not the source of truth.

export type FieldErrors = Record<string, string>;

const MAX_EVENT_SPAN_DAYS = 30;

export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function isPositiveInt(value: string, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (!/^\d+$/.test(value.trim())) return false;
  const n = Number(value);
  return n >= min && n <= max;
}

function checkBudget(min: string, max: string, errors: FieldErrors) {
  if (!/^\d+$/.test(min.trim())) errors.budgetMin = "Enter a minimum budget (0 or more)";
  if (!/^\d+$/.test(max.trim()) || Number(max) < 1) errors.budgetMax = "Enter a maximum budget";
  if (!errors.budgetMin && !errors.budgetMax && Number(max) < Number(min)) {
    errors.budgetMax = "Maximum must be greater than or equal to the minimum";
  }
}

function checkLength(value: string, max: number, key: string, errors: FieldErrors) {
  if (value.trim().length > max) errors[key] = `Keep this under ${max} characters`;
}

export function validateBasics(state: FormState): FieldErrors {
  const b = state.basics;
  const errors: FieldErrors = {};
  const name = b.eventName.trim();

  if (name.length < 3) errors.eventName = "Event name must be at least 3 characters";
  else if (name.length > 120) errors.eventName = "Keep the event name under 120 characters";
  if (!b.eventType) errors.eventType = "Select an event type";

  const today = todayISO();
  if (!b.startDate) errors.startDate = "Pick a date";
  else if (b.startDate < today) errors.startDate = "Event date cannot be in the past";

  if (b.dateMode === "range") {
    if (!b.endDate) errors.endDate = "Pick an end date";
    else if (b.startDate && b.endDate < b.startDate) errors.endDate = "End date must be on or after the start date";
    else if (b.startDate) {
      const span = (Date.parse(b.endDate) - Date.parse(b.startDate)) / 86400000;
      if (span > MAX_EVENT_SPAN_DAYS) errors.endDate = `Events can span at most ${MAX_EVENT_SPAN_DAYS} days`;
    }
  }

  if (b.location.trim().length < 2) errors.location = "Enter the city or area";
  checkLength(b.venue, 160, "venue", errors);
  if (!b.category) errors.category = "Choose what you're looking for";
  return errors;
}

const detailValidators: Record<Category, [(s: FormState) => FieldErrors, (s: FormState) => FieldErrors]> = {
  planner: [
    ({ planner: p }) => {
      const errors: FieldErrors = {};
      if (p.services.length === 0) errors.services = "Select at least one service";
      if (!isPositiveInt(p.guestCount, { max: 100000 })) errors.guestCount = "Enter the expected number of guests";
      if (!p.planningStage) errors.planningStage = "Tell planners where you are in the process";
      return errors;
    },
    ({ planner: p }) => {
      const errors: FieldErrors = {};
      checkBudget(p.budgetMin, p.budgetMax, errors);
      checkLength(p.theme, 200, "theme", errors);
      checkLength(p.notes, 1000, "notes", errors);
      return errors;
    },
  ],
  performer: [
    ({ performer: p }) => {
      const errors: FieldErrors = {};
      if (!p.performerType) errors.performerType = "Select a performer type";
      checkLength(p.genre, 120, "genre", errors);
      if (!isPositiveInt(p.audienceSize, { max: 100000 })) errors.audienceSize = "Enter the expected audience size";
      return errors;
    },
    ({ performer: p }) => {
      const errors: FieldErrors = {};
      if (!isPositiveInt(p.performanceDurationMins, { min: 15, max: 720 })) {
        errors.performanceDurationMins = "Duration must be between 15 and 720 minutes";
      }
      if (!p.soundSystemProvided) errors.soundSystemProvided = "Let performers know about sound equipment";
      checkBudget(p.budgetMin, p.budgetMax, errors);
      checkLength(p.notes, 1000, "notes", errors);
      return errors;
    },
  ],
  crew: [
    ({ crew: c }) => {
      const errors: FieldErrors = {};
      if (c.roles.length === 0) errors.roles = "Add at least one crew role";
      const seen = new Set<string>();
      c.roles.forEach((row, i) => {
        if (!row.role) errors[`roles.${i}.role`] = "Select a role";
        else if (seen.has(row.role)) errors[`roles.${i}.role`] = "This role is already listed";
        seen.add(row.role);
        if (!isPositiveInt(row.count, { max: 200 })) errors[`roles.${i}.count`] = "1–200";
      });
      return errors;
    },
    ({ crew: c }) => {
      const errors: FieldErrors = {};
      if (!c.startTime) errors.startTime = "Select a start time";
      if (!c.endTime) errors.endTime = "Select an end time";
      else if (c.startTime === c.endTime) errors.endTime = "Shift start and end cannot be the same";
      if (!c.experienceLevel) errors.experienceLevel = "Select an experience level";
      checkBudget(c.budgetMin, c.budgetMax, errors);
      checkLength(c.notes, 1000, "notes", errors);
      return errors;
    },
  ],
};

/** Validates a wizard step (0-based: 0 basics, 1 & 2 category details, 3 review). */
export function validateStep(step: number, state: FormState): FieldErrors {
  if (step === 0) return validateBasics(state);
  const category = state.basics.category;
  if (!category || step > 2) return {};
  return detailValidators[category][step - 1](state);
}

// Which top-level `details.*` keys live on Step 2 vs Step 3 for each category.
const DETAIL_STEP_FIELDS: Record<Category, [string[], string[]]> = {
  planner: [["services", "guestCount", "planningStage"], ["budget", "theme", "notes"]],
  performer: [["performerType", "genre", "audienceSize"], ["performanceDurationMins", "soundSystemProvided", "budget", "notes"]],
  crew: [["roles"], ["shift", "experienceLevel", "budget", "notes"]],
};

/**
 * Maps an API error path (e.g. "details.budget.max") to the wizard's field key
 * ("budgetMax") and the step that field lives on, so server errors can be
 * shown next to the right input.
 */
export function locateServerError(category: Category, path: string): { step: number; field: string } {
  if (!path.startsWith("details.")) return { step: 0, field: path };

  const rest = path.slice("details.".length);
  const field = rest
    .replace(/^budget\.(min|max)$/, (_, k: string) => (k === "min" ? "budgetMin" : "budgetMax"))
    .replace(/^shift\./, "");
  const step = DETAIL_STEP_FIELDS[category][0].includes(rest.split(".")[0]) ? 1 : 2;
  return { step, field };
}
