import { labelFor, type Category } from "./options";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function formatBudget(budget?: { min: number; max: number }) {
  if (!budget) return "—";
  return budget.min === budget.max ? inr.format(budget.max) : `${inr.format(budget.min)} – ${inr.format(budget.max)}`;
}

function formatDay(iso: string) {
  // Dates are calendar days; format in UTC so they never shift by a day.
  return new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateRange(startDate: string, endDate?: string) {
  if (!endDate || endDate.slice(0, 10) === startDate.slice(0, 10)) return formatDay(startDate);
  return `${formatDay(startDate)} → ${formatDay(endDate)}`;
}

function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

type Row = [label: string, value: string];

/** Human-readable rows for the category-specific `details` object. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function detailRows(category: Category, d: Record<string, any>): Row[] {
  const rows: Row[] = [];
  switch (category) {
    case "planner":
      rows.push(
        ["Services", (d.services as string[]).map(labelFor).join(", ")],
        ["Guests", String(d.guestCount)],
        ["Planning stage", labelFor(d.planningStage)],
        ["Budget", formatBudget(d.budget)],
      );
      if (d.theme) rows.push(["Theme", d.theme]);
      break;
    case "performer":
      rows.push(["Performer", labelFor(d.performerType)]);
      if (d.genre) rows.push(["Genre", d.genre]);
      rows.push(
        ["Audience", `${d.audienceSize} people`],
        ["Duration", `${d.performanceDurationMins} min`],
        ["Sound system", d.soundSystemProvided ? "Provided by host" : "Performer to bring"],
        ["Fee", formatBudget(d.budget)],
      );
      break;
    case "crew":
      rows.push(
        ["Roles", (d.roles as { role: string; count: number }[]).map((r) => `${labelFor(r.role)} × ${r.count}`).join(", ")],
        ["Shift", `${formatTime(d.shift.startTime)} – ${formatTime(d.shift.endTime)}${d.shift.endTime < d.shift.startTime ? " (overnight)" : ""}`],
        ["Experience", labelFor(d.experienceLevel)],
        ["Pay / person / day", formatBudget(d.budget)],
      );
      break;
  }
  if (d.notes) rows.push(["Notes", d.notes]);
  return rows;
}
