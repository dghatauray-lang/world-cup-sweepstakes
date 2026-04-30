"use client";

import { useState, useTransition } from "react";
import { adjustPointsAction, reassignTeamAction } from "./actions";

const TIER_BADGE: Record<string, string> = {
  S: "bg-purple-100 text-purple-700",
  A: "bg-yellow-100 text-yellow-700",
  B: "bg-blue-100 text-blue-700",
  C: "bg-gray-100 text-gray-600",
};

type UserEntry = {
  id: string;
  name: string | null;
  email: string;
  teams: { id: string; name: string; tier: string; points: number }[];
};

export default function AdjustPanel({ users }: { users: UserEntry[] }) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  // Points adjustment
  const [adjUserId, setAdjUserId] = useState(users[0]?.id ?? "");
  const adjUser = users.find((u) => u.id === adjUserId);
  const [adjTeamId, setAdjTeamId] = useState(adjUser?.teams[0]?.id ?? "");
  const [delta, setDelta] = useState("");

  // Reassign
  const [fromUserId, setFromUserId] = useState(users[0]?.id ?? "");
  const fromUser = users.find((u) => u.id === fromUserId);
  const [reassignTeamId, setReassignTeamId] = useState(fromUser?.teams[0]?.id ?? "");
  const [toUserId, setToUserId] = useState("");

  function handleAdjust() {
    const n = parseInt(delta, 10);
    if (isNaN(n)) return setFeedback("Enter a valid number (can be negative).");
    startTransition(async () => {
      try {
        await adjustPointsAction(adjUserId, adjTeamId, n);
        setFeedback(`Points adjusted by ${n > 0 ? "+" : ""}${n}.`);
        setDelta("");
      } catch (e) {
        setFeedback(String(e));
      }
    });
  }

  function handleReassign() {
    if (!toUserId) return setFeedback("Select a destination user.");
    if (fromUserId === toUserId) return setFeedback("Source and destination are the same user.");
    startTransition(async () => {
      try {
        await reassignTeamAction(reassignTeamId, fromUserId, toUserId);
        setFeedback("Team reassigned.");
      } catch (e) {
        setFeedback(String(e));
      }
    });
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          {feedback}
        </p>
      )}

      {/* Points adjustment */}
      <div className="rounded-xl border border-gray-200 p-4 space-y-3">
        <h3 className="text-sm font-semibold">Adjust Points</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">User</label>
            <select
              value={adjUserId}
              onChange={(e) => {
                setAdjUserId(e.target.value);
                const u = users.find((u) => u.id === e.target.value);
                setAdjTeamId(u?.teams[0]?.id ?? "");
              }}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Team</label>
            <select
              value={adjTeamId}
              onChange={(e) => setAdjTeamId(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
            >
              {(adjUser?.teams ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.points}pts) [{t.tier}]
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Delta (e.g. +5 or -3)</label>
            <input
              type="number"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="e.g. 5"
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 w-24"
            />
          </div>
          <button
            onClick={handleAdjust}
            disabled={isPending}
            className="text-sm bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {isPending ? "Saving…" : "Apply"}
          </button>
        </div>
      </div>

      {/* Team reassignment */}
      <div className="rounded-xl border border-gray-200 p-4 space-y-3">
        <h3 className="text-sm font-semibold">Reassign Team</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">From</label>
            <select
              value={fromUserId}
              onChange={(e) => {
                setFromUserId(e.target.value);
                const u = users.find((u) => u.id === e.target.value);
                setReassignTeamId(u?.teams[0]?.id ?? "");
              }}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Team</label>
            <select
              value={reassignTeamId}
              onChange={(e) => setReassignTeamId(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
            >
              {(fromUser?.teams ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  <span className={`${TIER_BADGE[t.tier]}`}>{t.tier}</span> {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">To</label>
            <select
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
            >
              <option value="">— Select user —</option>
              {users.filter((u) => u.id !== fromUserId).map((u) => (
                <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleReassign}
            disabled={isPending}
            className="text-sm bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {isPending ? "Moving…" : "Reassign"}
          </button>
        </div>
      </div>
    </div>
  );
}
