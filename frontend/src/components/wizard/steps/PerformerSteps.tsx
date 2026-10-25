"use client";

import { BudgetFields, ChoiceGroup, SectionHeading, SelectField, TextAreaField, TextField } from "@/components/ui/fields";
import type { PerformerState } from "@/lib/form";
import { PERFORMER_TYPES } from "@/lib/options";
import type { FieldErrors } from "@/lib/validation";

type Props = {
  value: PerformerState;
  onChange: (patch: Partial<PerformerState>) => void;
  errors: FieldErrors;
};

export function PerformerDetailsStep({ value, onChange, errors }: Props) {
  return (
    <div className="space-y-6">
      <SectionHeading title="Who would you like to perform?" description="Describe the act you have in mind." />
      <SelectField
        label="Performer type"
        value={value.performerType}
        onChange={(performerType) => onChange({ performerType })}
        options={PERFORMER_TYPES}
        placeholder="Select performer type"
        error={errors.performerType}
      />
      <TextField
        label="Genre or style"
        optional
        placeholder="e.g. Sufi, Bollywood retro, EDM"
        maxLength={120}
        value={value.genre}
        onChange={(genre) => onChange({ genre })}
        error={errors.genre}
      />
      <TextField
        label="Expected audience size"
        inputMode="numeric"
        placeholder="e.g. 300"
        value={value.audienceSize}
        onChange={(v) => onChange({ audienceSize: v.replace(/\D/g, "").slice(0, 6) })}
        error={errors.audienceSize}
        className="sm:max-w-xs"
      />
    </div>
  );
}

export function PerformerLogisticsStep({ value, onChange, errors }: Props) {
  return (
    <div className="space-y-6">
      <SectionHeading title="Logistics & budget" description="Set expectations for the performance." />
      <TextField
        label="Performance duration (minutes)"
        inputMode="numeric"
        placeholder="e.g. 90"
        value={value.performanceDurationMins}
        onChange={(v) => onChange({ performanceDurationMins: v.replace(/\D/g, "").slice(0, 3) })}
        error={errors.performanceDurationMins}
        hint="Between 15 and 720 minutes"
        className="sm:max-w-xs"
      />
      <ChoiceGroup
        legend="Will you provide a sound system?"
        options={[
          { value: "yes", label: "Yes, sound is arranged" },
          { value: "no", label: "No, performer should bring it" },
        ]}
        value={value.soundSystemProvided}
        onChange={(v) => onChange({ soundSystemProvided: v as PerformerState["soundSystemProvided"] })}
        error={errors.soundSystemProvided}
      />
      <BudgetFields
        label="Performance fee"
        min={value.budgetMin}
        max={value.budgetMax}
        onChange={(key, v) => onChange({ [key]: v })}
        errors={errors}
      />
      <TextAreaField
        label="Anything else performers should know?"
        optional
        maxLength={1000}
        placeholder="Song requests, language preferences, stage size…"
        value={value.notes}
        onChange={(notes) => onChange({ notes })}
        error={errors.notes}
      />
    </div>
  );
}
