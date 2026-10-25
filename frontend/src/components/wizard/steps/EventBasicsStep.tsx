"use client";

import { SectionHeading, SelectField, TextField } from "@/components/ui/fields";
import type { BasicsState } from "@/lib/form";
import { CATEGORIES, EVENT_TYPES, type Category } from "@/lib/options";
import { todayISO, type FieldErrors } from "@/lib/validation";

type Props = {
  value: BasicsState;
  onChange: (patch: Partial<BasicsState>) => void;
  errors: FieldErrors;
};

export function EventBasicsStep({ value, onChange, errors }: Props) {
  const today = todayISO();

  return (
    <div className="space-y-6">
      <SectionHeading title="Tell us about your event" description="The basics every professional needs to know." />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Event name"
          placeholder="e.g. Riya & Arjun's Sangeet"
          value={value.eventName}
          maxLength={120}
          onChange={(eventName) => onChange({ eventName })}
          error={errors.eventName}
          className="sm:col-span-2"
        />
        <SelectField
          label="Event type"
          value={value.eventType}
          onChange={(eventType) => onChange({ eventType })}
          options={EVENT_TYPES}
          placeholder="Select event type"
          error={errors.eventType}
          className="sm:col-span-2"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-800">Date</legend>
        <div role="radiogroup" aria-label="Date type" className="mb-3 inline-flex rounded-lg bg-slate-100 p-1 text-sm">
          {(["single", "range"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={value.dateMode === mode}
              onClick={() => onChange({ dateMode: mode, ...(mode === "single" ? { endDate: "" } : {}) })}
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                value.dateMode === mode ? "bg-white text-violet-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {mode === "single" ? "Single day" : "Multiple days"}
            </button>
          ))}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            type="date"
            label={value.dateMode === "range" ? "Start date" : "Event date"}
            min={today}
            value={value.startDate}
            onChange={(startDate) => onChange({ startDate })}
            error={errors.startDate}
          />
          {value.dateMode === "range" && (
            <TextField
              type="date"
              label="End date"
              min={value.startDate || today}
              value={value.endDate}
              onChange={(endDate) => onChange({ endDate })}
              error={errors.endDate}
            />
          )}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Location"
          placeholder="City or area, e.g. Pune"
          value={value.location}
          maxLength={120}
          onChange={(location) => onChange({ location })}
          error={errors.location}
        />
        <TextField
          label="Venue"
          optional
          placeholder="e.g. The Leela Palace"
          value={value.venue}
          maxLength={160}
          onChange={(venue) => onChange({ venue })}
          error={errors.venue}
          hint="Leave blank if not finalised yet"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-800">What are you looking for?</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {CATEGORIES.map((c) => {
            const selected = value.category === c.value;
            return (
              <label
                key={c.value}
                className={`relative flex cursor-pointer flex-col rounded-xl border-2 p-4 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet-500/40 ${
                  selected ? "border-violet-600 bg-violet-50" : "border-slate-200 bg-white hover:border-violet-300"
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={c.value}
                  checked={selected}
                  onChange={() => onChange({ category: c.value as Category })}
                  className="sr-only"
                />
                <span className="text-2xl" aria-hidden>
                  {c.icon}
                </span>
                <span className="mt-2 font-semibold text-slate-900">{c.label}</span>
                <span className="mt-1 text-xs leading-relaxed text-slate-600">{c.description}</span>
                {selected && (
                  <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-xs text-white">
                    ✓
                  </span>
                )}
              </label>
            );
          })}
        </div>
        {errors.category && (
          <p role="alert" className="mt-1.5 text-xs text-rose-600">
            {errors.category}
          </p>
        )}
      </fieldset>
    </div>
  );
}
