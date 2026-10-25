export function StepIndicator({ labels, current }: { labels: string[]; current: number }) {
  return (
    <nav aria-label="Progress" className="mb-6">
      <p className="mb-3 text-sm text-slate-600 sm:hidden">
        Step {current + 1} of {labels.length}: <span className="font-medium text-slate-900">{labels[current]}</span>
      </p>
      <ol className="flex items-center gap-2">
        {labels.map((label, i) => {
          const state = i < current ? "done" : i === current ? "current" : "upcoming";
          return (
            <li key={i} className="flex flex-1 items-center gap-2" aria-current={state === "current" ? "step" : undefined}>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition ${
                  state === "done"
                    ? "bg-violet-600 text-white"
                    : state === "current"
                      ? "border-2 border-violet-600 bg-white text-violet-700"
                      : "border-2 border-slate-200 bg-white text-slate-400"
                }`}
              >
                {state === "done" ? "✓" : i + 1}
              </span>
              <span
                className={`hidden text-sm sm:block ${state === "upcoming" ? "text-slate-400" : "font-medium text-slate-900"}`}
              >
                {label}
              </span>
              {i < labels.length - 1 && (
                <span className={`h-0.5 flex-1 rounded ${i < current ? "bg-violet-600" : "bg-slate-200"}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
