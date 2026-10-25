import Link from "next/link";
import { CATEGORIES } from "@/lib/options";

const STEPS = [
  { title: "Event basics", text: "Name, type, date, location and who you need." },
  { title: "Tailored details", text: "Two short steps with questions specific to planners, performers or crew." },
  { title: "Review & post", text: "Check everything, then post. It's filed under the right category instantly." },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <section className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">For event hosts</p>
        <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Tell us what your event needs. We&apos;ll find the right people.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
          Post a requirement for an event planner, performer or crew in under two minutes.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/post"
            className="rounded-lg bg-violet-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            Post a requirement
          </Link>
          <Link
            href="/requirements"
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Browse requirements
          </Link>
        </div>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-3">
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={`/requirements?category=${c.value}`}
            className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-violet-300 hover:shadow-sm"
          >
            <span className="text-3xl" aria-hidden>
              {c.icon}
            </span>
            <h2 className="mt-3 font-semibold text-slate-900">{c.label}</h2>
            <p className="mt-1 text-sm text-slate-600">{c.description}</p>
          </Link>
        ))}
      </section>

      <section className="mt-16">
        <h2 className="text-center text-2xl font-semibold text-slate-900">How it works</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-700">
                {i + 1}
              </span>
              <h3 className="mt-3 font-medium text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
