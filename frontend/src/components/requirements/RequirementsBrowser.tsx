"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getRequirementStats, listRequirements, type Pagination, type Requirement } from "@/lib/api";
import { detailRows, formatDateRange } from "@/lib/format";
import { CATEGORIES, labelFor, type Category } from "@/lib/options";

const PAGE_SIZE = 10;

type FetchResult =
  | {
      key: string;
      items: Requirement[];
      pagination: Pagination;
      counts: Record<Category, number> & { total: number };
    }
  | { key: string; error: string };

function parseCategory(value: string | null): Category | undefined {
  return CATEGORIES.some((c) => c.value === value) ? (value as Category) : undefined;
}

export function RequirementsBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = parseCategory(searchParams.get("category"));

  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${category ?? "all"}:${reloadCount}`;
  // Each result remembers which request produced it; while it doesn't match the
  // current key (new tab or retry), we're loading.
  const [result, setResult] = useState<FetchResult | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      listRequirements({ category, limit: PAGE_SIZE }, controller.signal),
      getRequirementStats(controller.signal),
    ])
      .then(([list, stats]) =>
        setResult({
          key: requestKey,
          items: list.data,
          pagination: list.pagination,
          counts: { ...stats.data.byCategory, total: stats.data.total },
        }),
      )
      .catch((err: Error) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, error: err.message });
      });
    return () => controller.abort();
  }, [category, requestKey]);

  const current = result?.key === requestKey ? result : null;
  const status = !current ? "loading" : "error" in current ? "error" : "ready";
  const items = current && !("error" in current) ? current.items : [];
  const pagination = current && !("error" in current) ? current.pagination : null;
  // Keep showing the previous counts while a new tab loads so the tabs don't flicker.
  const counts = result && !("error" in result) ? result.counts : null;

  const loadMore = useCallback(async () => {
    if (!current || "error" in current) return;
    setLoadingMore(true);
    setLoadMoreError("");
    try {
      const next = await listRequirements({ category, page: current.pagination.page + 1, limit: PAGE_SIZE });
      setResult({ ...current, items: [...current.items, ...next.data], pagination: next.pagination });
    } catch (err) {
      setLoadMoreError((err as Error).message);
    } finally {
      setLoadingMore(false);
    }
  }, [category, current]);

  const selectTab = (value?: Category) => {
    router.replace(value ? `${pathname}?category=${value}` : pathname, { scroll: false });
  };

  const tabs = [{ value: undefined, label: "All", count: counts?.total }, ...CATEGORIES.map((c) => ({ value: c.value, label: c.label, count: counts?.[c.value] }))];

  return (
    <div className="mt-6">
      <div role="tablist" aria-label="Filter by category" className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const active = tab.value === category;
          return (
            <button
              key={tab.label}
              role="tab"
              aria-selected={active}
              onClick={() => selectTab(tab.value)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                active ? "bg-violet-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-violet-300"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/20" : "bg-slate-100 text-slate-600"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {status === "loading" && (
          <ul className="space-y-4" aria-busy="true" aria-label="Loading requirements">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-40 animate-pulse rounded-2xl bg-slate-200/60" />
            ))}
          </ul>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="text-rose-800">{current && "error" in current ? current.error : ""}</p>
            <button
              onClick={() => setReloadCount((n) => n + 1)}
              className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-medium text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
            >
              Try again
            </button>
          </div>
        )}

        {status === "ready" && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-slate-600">
              No {category ? `${labelFor(category).toLowerCase()} ` : ""}requirements yet.
            </p>
            <Link href="/post" className="mt-3 inline-block font-medium text-violet-700 hover:underline">
              Post the first one →
            </Link>
          </div>
        )}

        {status === "ready" && items.length > 0 && (
          <>
            <ul className="space-y-4">
              {items.map((r) => (
                <RequirementCard key={r.id} requirement={r} />
              ))}
            </ul>
            {pagination && pagination.page < pagination.totalPages && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
                {loadMoreError && <p className="mt-2 text-sm text-rose-700">{loadMoreError}</p>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RequirementCard({ requirement: r }: { requirement: Requirement }) {
  const meta = CATEGORIES.find((c) => c.value === r.category)!;
  const rows = detailRows(r.category, r.details).filter(([label]) => label !== "Notes");

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
            <span aria-hidden>{meta.icon}</span> {meta.label}
          </span>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">{r.eventName}</h2>
          <p className="mt-0.5 text-sm text-slate-600">
            {labelFor(r.eventType)} · {formatDateRange(r.startDate, r.endDate)} · {r.location}
            {r.venue ? ` (${r.venue})` : ""}
          </p>
        </div>
        <time className="text-xs text-slate-500" dateTime={r.createdAt}>
          Posted {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </time>
      </div>
      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-2">
            <dt className="shrink-0 text-slate-500">{label}:</dt>
            <dd className="text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
    </li>
  );
}
