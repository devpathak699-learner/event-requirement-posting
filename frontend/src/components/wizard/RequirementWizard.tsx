"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ApiError, createRequirement, type Requirement } from "@/lib/api";
import { clearDraft, loadDraft, saveDraft } from "@/lib/draft";
import { buildPayload, initialFormState, stepLabels, type FormState } from "@/lib/form";
import { CATEGORIES, type Category } from "@/lib/options";
import { locateServerError, validateStep, type FieldErrors } from "@/lib/validation";
import { StepIndicator } from "./StepIndicator";
import { CrewRolesStep, CrewShiftStep } from "./steps/CrewSteps";
import { EventBasicsStep } from "./steps/EventBasicsStep";
import { PerformerDetailsStep, PerformerLogisticsStep } from "./steps/PerformerSteps";
import { PlannerBudgetStep, PlannerScopeStep } from "./steps/PlannerSteps";
import { ReviewStep } from "./steps/ReviewStep";

const LAST_STEP = 3;

/**
 * The wizard only renders in the browser (see ClientWizard), so the saved draft
 * can be read synchronously in the initial state without a hydration mismatch.
 */
export function RequirementWizard() {
  const [initialDraft] = useState(loadDraft);
  const [state, setState] = useState<FormState>(initialDraft?.state ?? initialFormState);
  const [step, setStep] = useState(initialDraft?.step ?? 0);
  // Client-side errors are only shown after the user tries to continue, then update live as they type.
  const [showErrors, setShowErrors] = useState(false);
  // Errors returned by the API, keyed by wizard field. Cleared as soon as the user edits anything.
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<Requirement | null>(null);
  const [draftRestored, setDraftRestored] = useState(initialDraft !== null);
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!created) saveDraft({ state, step });
  }, [state, step, created]);

  const errors: FieldErrors = showErrors ? { ...serverErrors, ...validateStep(step, state) } : serverErrors;
  const category = state.basics.category;

  const goTo = (next: number) => {
    setStep(next);
    setShowErrors(false);
    setServerErrors({});
    setSubmitError(null);
    headingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleNext = () => {
    const stepErrors = validateStep(step, state);
    if (Object.keys(stepErrors).length > 0) {
      setShowErrors(true);
      // Move focus to the first invalid field for keyboard and screen-reader users.
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    goTo(step + 1);
  };

  const handleSubmit = async () => {
    if (submitting || !category) return;

    // Re-check every step: a draft or an edit could have left an earlier step invalid.
    for (let s = 0; s < LAST_STEP; s++) {
      if (Object.keys(validateStep(s, state)).length > 0) {
        goTo(s);
        setShowErrors(true);
        return;
      }
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const { data } = await createRequirement(buildPayload(state));
      setCreated(data);
      clearDraft();
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_ERROR" && err.details.length > 0) {
        // Send the user back to the first step the server complained about,
        // with the server's messages shown next to the offending fields.
        const located = err.details.map((d) => ({ ...locateServerError(category, d.path), message: d.message }));
        const firstStep = Math.min(...located.map((l) => l.step));
        goTo(firstStep);
        setServerErrors(Object.fromEntries(located.filter((l) => l.step === firstStep).map((l) => [l.field, l.message])));
        setSubmitError("Please fix the highlighted fields and try again.");
      } else {
        setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const startOver = () => {
    clearDraft();
    setState(initialFormState);
    setCreated(null);
    setDraftRestored(false);
    goTo(0);
  };

  if (created) return <SuccessPanel requirement={created} onPostAnother={startOver} />;

  const patch =
    <K extends keyof FormState>(key: K) =>
    (value: Partial<FormState[K]>) => {
      setState((prev) => ({ ...prev, [key]: { ...prev[key], ...value } }));
      setServerErrors({});
    };

  return (
    <div ref={headingRef} className="scroll-mt-6">
      <StepIndicator labels={stepLabels(category)} current={step} />

      {draftRestored && step === 0 && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          <span>We restored your unsaved draft.</span>
          <button type="button" onClick={startOver} className="font-medium underline-offset-2 hover:underline">
            Start over
          </button>
        </div>
      )}

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (step === LAST_STEP) handleSubmit();
          else handleNext();
        }}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
      >
        {step === 0 && <EventBasicsStep value={state.basics} onChange={patch("basics")} errors={errors} />}

        {step > 0 && step < LAST_STEP && category && (
          <CategoryStep category={category} part={step as 1 | 2} state={state} patch={patch} errors={errors} />
        )}

        {step === LAST_STEP && category && <ReviewStep state={state} onEdit={goTo} />}

        {submitError && (
          <div role="alert" className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {submitError}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={() => goTo(step - 1)}
            disabled={step === 0 || submitting}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:invisible"
          >
            ← Back
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-70"
          >
            {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {step === LAST_STEP ? (submitting ? "Posting…" : "Post requirement") : "Continue →"}
          </button>
        </div>
      </form>
    </div>
  );
}

type CategoryStepProps = {
  category: Category;
  part: 1 | 2;
  state: FormState;
  patch: <K extends keyof FormState>(key: K) => (value: Partial<FormState[K]>) => void;
  errors: FieldErrors;
};

/** Renders Step 2 or Step 3 for whichever category was chosen in Step 1. */
function CategoryStep({ category, part, state, patch, errors }: CategoryStepProps) {
  switch (category) {
    case "planner": {
      const Step = part === 1 ? PlannerScopeStep : PlannerBudgetStep;
      return <Step value={state.planner} onChange={patch("planner")} errors={errors} />;
    }
    case "performer": {
      const Step = part === 1 ? PerformerDetailsStep : PerformerLogisticsStep;
      return <Step value={state.performer} onChange={patch("performer")} errors={errors} />;
    }
    case "crew": {
      const Step = part === 1 ? CrewRolesStep : CrewShiftStep;
      return <Step value={state.crew} onChange={patch("crew")} errors={errors} />;
    }
  }
}

function SuccessPanel({ requirement, onPostAnother }: { requirement: Requirement; onPostAnother: () => void }) {
  const meta = CATEGORIES.find((c) => c.value === requirement.category)!;
  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
        ✓
      </div>
      <h2 className="mt-4 text-2xl font-semibold text-slate-900">Requirement posted!</h2>
      <p className="mt-2 text-slate-600">
        <strong>{requirement.eventName}</strong> is now live under{" "}
        <span className="font-medium text-violet-700">
          {meta.icon} {meta.label}
        </span>{" "}
        requirements.
      </p>
      <p className="mt-3 text-xs text-slate-500">
        Reference ID: <code className="rounded bg-slate-100 px-1.5 py-0.5">{requirement.id}</code>
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href={`/requirements?category=${requirement.category}`}
          className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
        >
          View {meta.label.toLowerCase()} requirements
        </Link>
        <button
          type="button"
          onClick={onPostAnother}
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Post another requirement
        </button>
      </div>
    </div>
  );
}
