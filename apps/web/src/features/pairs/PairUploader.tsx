import React, { useMemo, useState } from "react";
import PairTile from "./PairTile";
import { describeCard, type DescribeResult } from "./api";


type Pair = {
  front?: File;
  back?: File;
  status: "empty" | "ready" | "processing" | "done" | "error";
  result?: DescribeResult;
  error?: string;
};

export default function PairUploader() {
  const [pairs, setPairs] = useState<Pair[]>([{ status: "empty" }, { status: "empty" }]);

  const setAt = (i: number, patch: Partial<Pair>) => {
    setPairs((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  };

  const onSelect = (i: number, side: "front" | "back", file: File) => {
    setPairs((prev) =>
      prev.map((p, idx) => {
        if (idx !== i) return p;
        const next: Pair = { ...p, [side]: file };
        next.status = (next.front && next.back) ? "ready" : "empty";
        return next;
      })
    );
  };

  const onRemove = (i: number, side: "front" | "back") => {
    setAt(i, { [side]: undefined, status: "empty", result: undefined, error: undefined });
  };

  const addSlot = () => setPairs((prev) => [...prev, { status: "empty" }]);

  const canProcess = useMemo(
    () => pairs.some((p) => p.front && p.back),
    [pairs]
  );

  const processAll = async () => {
    const next = [...pairs];
    for (let i = 0; i < next.length; i++) {
      const p = next[i];
      if (!p.front || !p.back) continue;
      next[i] = { ...p, status: "processing", error: undefined };
      setPairs([...next]);

      try {
        // For MVP we call describe on FRONT image only (grading/ID uses front).
        const result = await describeCard(p.front);
        next[i] = { ...next[i], status: "done", result };
      } catch (e: any) {
        next[i] = { ...next[i], status: "error", error: e?.message || "Failed" };
      }
      setPairs([...next]);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-2 text-2xl font-semibold text-ink">Upload card pairs</h1>
      <p className="mb-6 text-sm text-muted">
        Add the front and back image for each card. You can add more pairs below. When ready, click <span className="font-medium">Process</span>.
      </p>

      <div className="grid gap-4">
        {pairs.map((p, i) => (
          <div key={i}>
            <PairTile
              index={i}
              front={p.front}
              back={p.back}
              onSelect={(side, f) => onSelect(i, side, f)}
              onRemove={(side) => onRemove(i, side)}
            />

            {/* Result panel */}
            {p.status === "processing" && (
              <div className="mt-2 rounded-xl border border-border bg-surface p-3 text-sm text-muted">
                Processing…
              </div>
            )}

            {p.status === "error" && (
              <div className="mt-2 rounded-xl border border-border bg-white p-3 text-sm text-red-600">
                {p.error}
              </div>
            )}

            {p.status === "done" && p.result && (
              <div className="mt-2 rounded-xl border border-border bg-white p-4">
                <div className="mb-1 text-sm font-medium text-ink">Generated Listing</div>
                <div className="text-sm">
                  <div className="font-semibold">{p.result.listing.title}</div>
                  <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-surface p-3 text-xs text-ink">
{p.result.listing.description}
                  </pre>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <Badge ok={!p.result.needsManualReview}>
                      {p.result.needsManualReview ? "Manual review required" : "Auto-ready"}
                    </Badge>
                    <span>Confidence: {p.result.confidence.toFixed(3)}</span>
                  </div>
                  
                  {/* AI Processed Images */}
                  {p.result.grade?.records?.[0] && (
                    <div className="mt-4">
                      <div className="mb-2 text-sm font-medium text-ink">AI Processed Images</div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {p.result.grade.records[0]._exact_url_card && (
                          <div className="text-center">
                            <div className="mb-2 text-xs text-muted">Clean Card (AI Isolated)</div>
                            <img
                              src={p.result.grade.records[0]._exact_url_card}
                              alt="AI processed exact card"
                              className="mx-auto h-32 w-auto rounded-lg border border-border shadow-sm hover:scale-110 transition-transform duration-200"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden mx-auto h-32 w-24 rounded-lg border border-border bg-surface flex items-center justify-center text-xs text-muted">
                              Image failed to load
                            </div>
                          </div>
                        )}
                        {p.result.grade.records[0]._full_url_card && (
                          <div className="text-center">
                            <div className="mb-2 text-xs text-muted">Graded Card (With Analysis)</div>
                            <img
                              src={p.result.grade.records[0]._full_url_card}
                              alt="AI processed full card with grading"
                              className="mx-auto h-32 w-auto rounded-lg border border-border shadow-sm hover:scale-110 transition-transform duration-200"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden mx-auto h-32 w-24 rounded-lg border border-border bg-surface flex items-center justify-center text-xs text-muted">
                              Image failed to load
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Grading Details */}
                      {p.result.grade.records[0].grades && (
                        <div className="mt-4 rounded-lg bg-surface p-3">
                          <div className="mb-2 text-sm font-medium text-ink">AI Grading Results</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted">Final Grade:</span>
                              <span className="font-medium text-ink">{p.result.grade.records[0].grades.final}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted">Condition:</span>
                              <span className="font-medium text-ink">{p.result.grade.records[0].grades.condition}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted">Corners:</span>
                              <span className="font-medium text-ink">{p.result.grade.records[0].grades.corners}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted">Edges:</span>
                              <span className="font-medium text-ink">{p.result.grade.records[0].grades.edges}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted">Surface:</span>
                              <span className="font-medium text-ink">{p.result.grade.records[0].grades.surface}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted">Centering:</span>
                              <span className="font-medium text-ink">{p.result.grade.records[0].grades.centering}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={addSlot}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-ink hover:bg-white"
        >
          + Add Another Pair
        </button>

        <button
          type="button"
          disabled={!canProcess}
          onClick={processAll}
          className="rounded-lg bg-brand px-4 py-2 text-sm text-white disabled:opacity-50"
          aria-disabled={!canProcess}
        >
          Process
        </button>
      </div>
      
    </div>
  );
}

function Badge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 ${
        ok
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {children}
    </span>
  );
}