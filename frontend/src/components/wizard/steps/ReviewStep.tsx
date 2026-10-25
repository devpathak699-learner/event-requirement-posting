"use client";

import type { ReactNode } from "react";
import { SectionHeading } from "@/components/ui/fields";
import { buildPayload, STEP_TITLES, type FormState } from "@/lib/form";
import { detailRows, formatDateRange } from "@/lib/format";
import { CATEGORIES, labelFor, type Category } from "@/lib/options";

type Props = {
  state: FormState;
  onEdit: (step: number) => void;
};

export function ReviewStep({ state, onEdit }: Props) {
  const payload = buildPayload(state);
  const category = payload.category as Category;
  const categoryMeta = CATEGORIES.find((c) => c.value === category)!;
  const rows = detailRows(category, payload.details);
  const [step2Title, step3Title] = STEP_TITLES[category];

  return (
    <div className="space-y-6">
      <SectionHeading title="Review your requirement" description="Check everything looks right before posting." />

      <div className="flex items-center gap-3 rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-900">
        <span className="text-xl" aria-hidden>
          {categoryMeta.icon}
        </span>
        <span>
          This will be posted under <strong>{categoryMeta.label}</strong> requirements.
        </span>
      </div>

      <ReviewSection title="Event basics" onEdit={() => onEdit(0)}>
        <Row label="Event" value={payload.eventName} />
        <Row label="Type" value={labelFor(payload.eventType)} />
        <Row label="Date" value={formatDateRange(payload.startDate, payload.endDate)} />
        <Row label="Location" value={payload.location} />
        {payload.venue && <Row label="Venue" value={payload.venue} />}
      </ReviewSection>

      <ReviewSection title={`${step2Title} · ${step3Title}`} onEdit={() => onEdit(1)}>
        {rows.map(([label, value]) => (
          <Row key={label} label={label} value={value} />
        ))}
      </ReviewSection>
    </div>
  );
}

function ReviewSection({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <button type="button" onClick={onEdit} className="text-sm font-medium text-violet-700 hover:underline">
          Edit
        </button>
      </header>
      <dl className="divide-y divide-slate-100">{children}</dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 px-4 py-2.5 text-sm sm:grid-cols-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="whitespace-pre-line break-words text-slate-900 sm:col-span-2">{value}</dd>
    </div>
  );
}
