"use client";

import dynamic from "next/dynamic";

// The wizard restores drafts from localStorage on first render, so it is
// rendered on the client only. A skeleton is shown while the chunk loads.
export const ClientWizard = dynamic(() => import("./RequirementWizard").then((m) => m.RequirementWizard), {
  ssr: false,
  loading: () => (
    <div aria-busy="true" aria-label="Loading form">
      <div className="mb-6 h-8 animate-pulse rounded-lg bg-slate-200/70" />
      <div className="h-[28rem] animate-pulse rounded-2xl bg-slate-200/60" />
    </div>
  ),
});
