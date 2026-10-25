"use client";

import { BudgetFields, ChoiceGroup, SectionHeading, SelectField, TextAreaField, TextField } from "@/components/ui/fields";
import type { CrewRoleRow, CrewState } from "@/lib/form";
import { CREW_ROLES, EXPERIENCE_LEVELS } from "@/lib/options";
import type { FieldErrors } from "@/lib/validation";

type Props = {
  value: CrewState;
  onChange: (patch: Partial<CrewState>) => void;
  errors: FieldErrors;
};

const MAX_ROLES = CREW_ROLES.length;

export function CrewRolesStep({ value, onChange, errors }: Props) {
  const updateRow = (index: number, patch: Partial<CrewRoleRow>) =>
    onChange({ roles: value.roles.map((row, i) => (i === index ? { ...row, ...patch } : row)) });

  const takenRoles = new Set(value.roles.map((r) => r.role));

  return (
    <div className="space-y-6">
      <SectionHeading title="Which crew do you need?" description="Add each role and how many people you need." />

      <ul className="space-y-3">
        {value.roles.map((row, index) => (
          <li key={index} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <SelectField
              label={`Role ${index + 1}`}
              value={row.role}
              onChange={(role) => updateRow(index, { role })}
              // Hide roles already used in other rows to prevent duplicates.
              options={CREW_ROLES.filter((r) => r.value === row.role || !takenRoles.has(r.value))}
              placeholder="Select role"
              error={errors[`roles.${index}.role`]}
              className="flex-1"
            />
            <TextField
              label="People"
              inputMode="numeric"
              value={row.count}
              onChange={(v) => updateRow(index, { count: v.replace(/\D/g, "").slice(0, 3) })}
              error={errors[`roles.${index}.count`]}
              className="w-24"
            />
            <button
              type="button"
              onClick={() => onChange({ roles: value.roles.filter((_, i) => i !== index) })}
              disabled={value.roles.length === 1}
              aria-label={`Remove role ${index + 1}`}
              className="mt-7 rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:pointer-events-none disabled:opacity-30"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {errors.roles && (
        <p role="alert" className="text-xs text-rose-600">
          {errors.roles}
        </p>
      )}

      {value.roles.length < MAX_ROLES && (
        <button
          type="button"
          onClick={() => onChange({ roles: [...value.roles, { role: "", count: "1" }] })}
          className="rounded-lg border border-dashed border-violet-400 px-4 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
        >
          + Add another role
        </button>
      )}
    </div>
  );
}

export function CrewShiftStep({ value, onChange, errors }: Props) {
  const overnight = value.startTime && value.endTime && value.endTime < value.startTime;

  return (
    <div className="space-y-6">
      <SectionHeading title="Shift & budget" description="When crew should be on site and what you can pay." />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          type="time"
          label="Shift starts"
          value={value.startTime}
          onChange={(startTime) => onChange({ startTime })}
          error={errors.startTime}
        />
        <TextField
          type="time"
          label="Shift ends"
          value={value.endTime}
          onChange={(endTime) => onChange({ endTime })}
          error={errors.endTime}
          hint={overnight ? "Ends the next day (overnight shift)" : undefined}
        />
      </div>
      <ChoiceGroup
        legend="Experience level"
        options={EXPERIENCE_LEVELS}
        value={value.experienceLevel}
        onChange={(experienceLevel) => onChange({ experienceLevel })}
        error={errors.experienceLevel}
      />
      <BudgetFields
        label="Pay per person, per day"
        min={value.budgetMin}
        max={value.budgetMax}
        onChange={(key, v) => onChange({ [key]: v })}
        errors={errors}
      />
      <TextAreaField
        label="Anything else the crew should know?"
        optional
        maxLength={1000}
        placeholder="Dress code, equipment to bring, meals provided…"
        value={value.notes}
        onChange={(notes) => onChange({ notes })}
        error={errors.notes}
      />
    </div>
  );
}
