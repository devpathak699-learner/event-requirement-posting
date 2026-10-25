import { initialFormState, type FormState } from "./form";

const KEY = "requirement-draft:v1";

type Draft = { state: FormState; step: number };

// Storage can be unavailable (private mode, blocked cookies) — the form must
// still work, so every access is wrapped and failures are ignored.

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    // Merge over the defaults so drafts saved by an older version still have every field.
    const state: FormState = {
      basics: { ...initialFormState.basics, ...parsed.state?.basics },
      planner: { ...initialFormState.planner, ...parsed.state?.planner },
      performer: { ...initialFormState.performer, ...parsed.state?.performer },
      crew: { ...initialFormState.crew, ...parsed.state?.crew },
    };
    const step = Number.isInteger(parsed.step) && parsed.step >= 0 && parsed.step <= 3 ? parsed.step : 0;
    // A draft with no category can't be on a category step.
    return { state, step: state.basics.category ? step : 0 };
  } catch {
    return null;
  }
}

export function saveDraft(draft: Draft) {
  try {
    localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // ignore
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
