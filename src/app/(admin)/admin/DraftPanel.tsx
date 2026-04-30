"use client";

import { useState, useTransition } from "react";
import { previewDraftAction, confirmDraftAction, type PreviewRow } from "./actions";

const TIER_COLORS: Record<string, string> = {
  S: "bg-purple-100 text-purple-800",
  A: "bg-yellow-100 text-yellow-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-gray-100 text-gray-600",
};

export default function DraftPanel({ userCount }: { userCount: number }) {
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handlePreview() {
    setError(null);
    startTransition(async () => {
      try {
        const rows = await previewDraftAction();
        setPreview(rows);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Preview failed.");
      }
    });
  }

  function handleReshuffle() {
    setPreview(null);
    handlePreview();
  }

  function handleConfirm() {
    if (!preview) return;
    setError(null);
    startTransition(async () => {
      try {
        await confirmDraftAction(preview.map(({ userId, teamId }) => ({ userId, teamId })));
        setDone(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Confirm failed.");
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-xl border border-green-300 bg-green-50 p-6 text-center">
        <p className="text-lg font-semibold text-green-700">Draft complete! Reload to see assignments.</p>
      </div>
    );
  }

  // Group preview rows by user for display
  const byUser: Record<string, { userName: string; isHouse: boolean; teams: PreviewRow[] }> = {};
  if (preview) {
    for (const row of preview) {
      if (!byUser[row.userId]) {
        byUser[row.userId] = { userName: row.userName, isHouse: row.isHouse, teams: [] };
      }
      byUser[row.userId].teams.push(row);
    }
  }

  const userEntries = Object.entries(byUser).sort((a, b) => {
    if (a[1].isHouse) return 1;
    if (b[1].isHouse) return -1;
    return a[1].userName.localeCompare(b[1].userName);
  });

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {!preview ? (
          <button
            onClick={handlePreview}
            disabled={isPending || userCount === 0}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
          >
            {isPending ? "Generating…" : "Generate Preview"}
          </button>
        ) : (
          <>
            <button
              onClick={handleConfirm}
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
            >
              {isPending ? "Saving…" : "✓ Confirm This Draft"}
            </button>
            <button
              onClick={handleReshuffle}
              disabled={isPending}
              className="border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
            >
              ↺ Re-shuffle
            </button>
          </>
        )}
        {userCount === 0 && (
          <p className="text-sm text-red-500">No registered users — invite people to sign up first.</p>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Preview table */}
      {preview && (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            Preview only — not saved yet. Teams are distributed to equalise draft value.
            Users who land an elite (S/A) team get fewer teams overall; users who miss out
            receive more mid-tier teams to compensate.
          </p>
          <div className="grid gap-4">
            {userEntries.map(([userId, { userName, isHouse, teams }]) => (
              <div key={userId} className={`rounded-lg border p-4 ${isHouse ? "border-dashed border-gray-300 bg-gray-50" : "border-gray-200"}`}>
                <p className="font-semibold text-sm mb-2">
                  {isHouse ? "🏠 House (leftover teams)" : userName}
                  <span className="text-gray-400 font-normal ml-2">({teams.length} teams)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {teams
                    .sort((a, b) => a.teamTier.localeCompare(b.teamTier))
                    .map((row) => (
                      <span
                        key={row.teamId}
                        className={`text-xs px-2 py-1 rounded-full font-medium ${TIER_COLORS[row.teamTier] ?? "bg-gray-100"}`}
                      >
                        {row.teamName} <span className="opacity-60">({row.teamTier})</span>
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
