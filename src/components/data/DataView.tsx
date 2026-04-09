import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

interface EventRow {
  id?: number;
  user_id: string | null;
  step_id: string;
  answer: string | null;
  correct: boolean;
  boba_total: number | null;
  et_time: string | null;
  commit?: string | null;
  created_at?: string | null;
}

type AttemptFilter = "first" | "all";

function toDate(row: EventRow): Date | null {
  const s = row.created_at || row.et_time;
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function isFirstTry(stepId: string): boolean {
  // First-try events have no dot suffix like ".r2" or ".fix".
  return !stepId.includes(".");
}

function baseStepId(stepId: string): string {
  return stepId.split(".")[0];
}

export default function DataView() {
  const [rows, setRows] = useState<EventRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Default range: last 7 days
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 6 * 86400000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const [from, setFrom] = useState<string>(fmt(weekAgo));
  const [to, setTo] = useState<string>(fmt(today));
  const [attemptFilter, setAttemptFilter] = useState<AttemptFilter>("first");
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    supabase
      .from("events")
      .select("*")
      .order("id", { ascending: false })
      .limit(10000)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRows((data as EventRow[]) ?? []);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const fromD = from ? new Date(from + "T00:00:00") : null;
    const toD = to ? new Date(to + "T23:59:59") : null;
    return rows.filter((r) => {
      if (attemptFilter === "first" && !isFirstTry(r.step_id)) return false;
      if (userId && r.user_id !== userId) return false;
      const d = toDate(r);
      if (fromD && (!d || d < fromD)) return false;
      if (toD && (!d || d > toD)) return false;
      return true;
    });
  }, [rows, from, to, attemptFilter, userId]);

  const userIds = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows ?? []) if (r.user_id) s.add(r.user_id);
    return [...s].sort();
  }, [rows]);

  // Group by base step_id → {correct, wrong}
  const byStep = useMemo(() => {
    const m = new Map<string, { correct: number; wrong: number }>();
    for (const r of filtered) {
      const key = baseStepId(r.step_id);
      const cur = m.get(key) || { correct: 0, wrong: 0 };
      if (r.correct) cur.correct += 1;
      else cur.wrong += 1;
      m.set(key, cur);
    }
    // Sort by step id — natural sort on dashes
    return [...m.entries()].sort((a, b) => {
      const pa = a[0].split("-").map((n) => parseInt(n, 10) || 0);
      const pb = b[0].split("-").map((n) => parseInt(n, 10) || 0);
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const d = (pa[i] || 0) - (pb[i] || 0);
        if (d !== 0) return d;
      }
      return 0;
    });
  }, [filtered]);

  const maxCount = useMemo(
    () => byStep.reduce((m, [, v]) => Math.max(m, v.correct + v.wrong), 1),
    [byStep],
  );

  const totalCorrect = filtered.filter((r) => r.correct).length;
  const totalWrong = filtered.length - totalCorrect;
  const pct =
    filtered.length > 0
      ? Math.round((totalCorrect / filtered.length) * 100)
      : 0;

  return (
    <div className="data-view" style={{ padding: 24, fontFamily: "inherit", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 18 }}>
        <a href="/" style={{ color: "#57B477", fontWeight: 700, textDecoration: "none" }}>
          ← Back to map
        </a>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0 }}>Event data</h1>
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "flex-end",
          padding: 14,
          background: "#fafafa",
          border: "2px solid #eee",
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <Field label="From">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="To">
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <Field label="Attempts">
          <select
            value={attemptFilter}
            onChange={(e) => setAttemptFilter(e.target.value as AttemptFilter)}
          >
            <option value="first">First try only</option>
            <option value="all">All tries</option>
          </select>
        </Field>
        <Field label="User">
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">All users</option>
            {userIds.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </Field>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => {
            setFrom("");
            setTo("");
          }}
          style={btnStyle}
        >
          Clear dates
        </button>
      </div>

      {error && <div style={{ color: "#c44", fontWeight: 700 }}>Error: {error}</div>}
      {!rows && !error && <div>Loading…</div>}

      {rows && (
        <>
          <div style={{ marginBottom: 14, fontSize: 14, color: "#444" }}>
            <strong>{filtered.length}</strong> events ·{" "}
            <span style={{ color: "#57B477" }}>{totalCorrect} correct</span> ·{" "}
            <span style={{ color: "#c44" }}>{totalWrong} wrong</span> · {pct}% correct
            across {byStep.length} steps
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {byStep.map(([stepId, v]) => {
              const total = v.correct + v.wrong;
              const pctCorrect = total > 0 ? Math.round((v.correct / total) * 100) : 0;
              const scale = (n: number) => (n / maxCount) * 100;
              return (
                <div
                  key={stepId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr 90px",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 700,
                      color: "#666",
                      textAlign: "right",
                    }}
                  >
                    {stepId}
                  </div>
                  <div
                    style={{
                      position: "relative",
                      height: 22,
                      background: "#f3f3f3",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${scale(v.correct)}%`,
                        background: "#57B477",
                      }}
                      title={`${v.correct} correct`}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: `${scale(v.correct)}%`,
                        top: 0,
                        bottom: 0,
                        width: `${scale(v.wrong)}%`,
                        background: "#e06a6a",
                      }}
                      title={`${v.wrong} wrong`}
                    />
                  </div>
                  <div style={{ color: "#444", fontWeight: 700 }}>
                    {v.correct}/{total} · {pctCorrect}%
                  </div>
                </div>
              );
            })}
            {byStep.length === 0 && (
              <div style={{ color: "#888" }}>No events match these filters.</div>
            )}
          </div>

          <div style={{ marginTop: 24, fontSize: 12, color: "#888" }}>
            <span style={{ display: "inline-block", width: 12, height: 12, background: "#57B477", borderRadius: 2, marginRight: 6, verticalAlign: "middle" }} />
            Correct
            <span style={{ display: "inline-block", width: 12, height: 12, background: "#e06a6a", borderRadius: 2, marginLeft: 16, marginRight: 6, verticalAlign: "middle" }} />
            Wrong
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", fontSize: 12, fontWeight: 700, color: "#666" }}>
      {label}
      <div style={{ marginTop: 4 }}>{children}</div>
    </label>
  );
}

const btnStyle: React.CSSProperties = {
  background: "#fff",
  border: "2px solid #ddd",
  borderRadius: 8,
  padding: "6px 12px",
  fontFamily: "inherit",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
};
