"use client";

import { useState, useTransition } from "react";
import { proposeTradeAction } from "./actions";

const TIER_BADGE: Record<string, string> = {
  S: "bg-purple-100 text-purple-700",
  A: "bg-yellow-100 text-yellow-700",
  B: "bg-blue-100 text-blue-700",
  C: "bg-gray-100 text-gray-600",
};

type Team = { id: string; name: string; tier: string; flagUrl: string | null };
type UserOption = { id: string; name: string | null; email: string };
type UserTeamsMap = Record<string, Team[]>;

export default function ProposeTradeForm({
  myTeams,
  otherUsers,
  userTeamsMap,
}: {
  myTeams: Team[];
  otherUsers: UserOption[];
  userTeamsMap: UserTeamsMap;
}) {
  const [recipientId, setRecipientId] = useState("");
  const [offered, setOffered] = useState<Set<string>>(new Set());
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const recipientTeams = recipientId ? (userTeamsMap[recipientId] ?? []) : [];

  function toggle(set: Set<string>, id: string): Set<string> {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  }

  function handleRecipientChange(id: string) {
    setRecipientId(id);
    setRequested(new Set()); // clear requested teams when recipient changes
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await proposeTradeAction(
        recipientId,
        [...offered],
        [...requested],
        message
      );
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setOffered(new Set());
        setRequested(new Set());
        setRecipientId("");
        setMessage("");
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 p-6 space-y-5">
      <h3 className="font-semibold text-base">Propose a Trade</h3>

      {/* Recipient */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Trade with</label>
        <select
          value={recipientId}
          onChange={(e) => handleRecipientChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select a player…</option>
          {otherUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name ?? u.email}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Teams to offer */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">
            Your teams to offer{" "}
            {offered.size > 0 && <span className="text-green-600">({offered.size} selected)</span>}
          </p>
          {myTeams.length === 0 ? (
            <p className="text-xs text-gray-400">You have no teams.</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {myTeams.map((t) => (
                <label
                  key={t.id}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer border text-sm transition-colors ${
                    offered.has(t.id) ? "border-green-400 bg-green-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={offered.has(t.id)}
                    onChange={() => setOffered(toggle(offered, t.id))}
                    className="accent-green-600"
                  />
                  {t.flagUrl && <img src={t.flagUrl} alt="" className="w-5 h-3.5 object-cover rounded-sm" />}
                  <span className="flex-1">{t.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${TIER_BADGE[t.tier] ?? ""}`}>
                    {t.tier}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Teams to request */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">
            Their teams to request{" "}
            {requested.size > 0 && <span className="text-green-600">({requested.size} selected)</span>}
          </p>
          {!recipientId ? (
            <p className="text-xs text-gray-400">Select a player first.</p>
          ) : recipientTeams.length === 0 ? (
            <p className="text-xs text-gray-400">This player has no teams.</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {recipientTeams.map((t) => (
                <label
                  key={t.id}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer border text-sm transition-colors ${
                    requested.has(t.id) ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={requested.has(t.id)}
                    onChange={() => setRequested(toggle(requested, t.id))}
                    className="accent-blue-600"
                  />
                  {t.flagUrl && <img src={t.flagUrl} alt="" className="w-5 h-3.5 object-cover rounded-sm" />}
                  <span className="flex-1">{t.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${TIER_BADGE[t.tier] ?? ""}`}>
                    {t.tier}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Message (optional)</label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. Fair swap — both Group A teams"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">✓ Trade proposed successfully!</p>}

      <button
        onClick={handleSubmit}
        disabled={isPending || !recipientId || offered.size === 0 || requested.size === 0}
        className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
      >
        {isPending ? "Sending…" : "Send Trade Proposal"}
      </button>
    </div>
  );
}
