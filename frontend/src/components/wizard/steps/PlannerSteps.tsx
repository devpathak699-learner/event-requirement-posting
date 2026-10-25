"use client";

import { BudgetFields, ChoiceGroup, SectionHeading, TextAreaField, TextField } from "@/components/ui/fields";
import type { PlannerState } from "@/lib/form";
import { PLANNER_SERVICES, PLANNING_STAGES } from "@/lib/options";
import type { FieldErrors } from "@/lib/validation";

type Props = {
  value: PlannerState;
  onChange: (patch: Partial<PlannerState>) => void;
  errors: FieldErrors;
};

export function PlannerScopeStep({ value, onChange, errors }: Props) {
  return (
    <div className="space-y-6">
      <SectionHeading title="What should the planner handle?" description="Helps planners judge if they're the right fit." />
      <ChoiceGroup
        multiple
        legend="Services needed"
        options={PLANNER_SERVICES}
        value={value.services}
        onChange={(services) => onChange({ services })}
        error={errors.services}
        hint="Select all that apply"
      />
      <TextField
        label="Expected guest count"
        inputMode="numeric"
        placeholder="e.g. 200"
        value={value.guestCount}
        onChange={(v) => onChange({ guestCount: v.replace(/\D/g, "").slice(0, 6) })}
        error={errors.guestCount}
        className="sm:max-w-xs"
      />
      <ChoiceGroup
        legend="Where are you in the planning process?"
        options={PLANNING_STAGES}
        value={value.planningStage}
        onChange={(planningStage) => onChange({ planningStage })}
        error={errors.planningStage}
      />
    </div>
  );
}

export function PlannerBudgetStep({ value, onChange, errors }: Props) {
  return (
    <div className="space-y-6">
      <SectionHeading title="Budget & preferences" description="A realistic range gets you better, faster responses." />
      <BudgetFields
        label="Planner budget"
        min={value.budgetMin}
        max={value.budgetMax}
        onChange={(key, v) => onChange({ [key]: v })}
        errors={errors}
        hint="Planner fees only, excluding venue, catering and other vendors"
      />
      <TextField
        label="Theme or style"
        optional
        placeholder="e.g. Pastel boho, royal Rajasthani"
        maxLength={200}
        value={value.theme}
        onChange={(theme) => onChange({ theme })}
        error={errors.theme}
      />
      <TextAreaField
        label="Anything else planners should know?"
        optional
        maxLength={1000}
        placeholder="Must-haves, cultural requirements, past experiences…"
        value={value.notes}
        onChange={(notes) => onChange({ notes })}
        error={errors.notes}
      />
    </div>
  );
}
