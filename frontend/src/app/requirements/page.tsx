import type { Metadata } from "next";
import { Suspense } from "react";
import { RequirementsBrowser } from "@/components/requirements/RequirementsBrowser";

export const metadata: Metadata = { title: "Browse requirements" };

export default function RequirementsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Requirements</h1>
      <p className="mt-1 text-slate-600">Posted requirements, grouped by what the host is looking for.</p>
      {/* useSearchParams in the browser component needs a Suspense boundary. */}
      <Suspense>
        <RequirementsBrowser />
      </Suspense>
    </div>
  );
}
