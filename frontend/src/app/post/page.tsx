import type { Metadata } from "next";
import { ClientWizard } from "@/components/wizard/ClientWizard";

export const metadata: Metadata = { title: "Post a requirement" };

export default function PostRequirementPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-slate-900">Post a requirement</h1>
      <ClientWizard />
    </div>
  );
}
