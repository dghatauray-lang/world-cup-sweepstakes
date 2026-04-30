"use client";

import { useState, useTransition } from "react";
import { triggerSyncAction, checkApiStatusAction } from "./actions";
import type { SyncResult } from "@/lib/sync";

export default function SyncPanel({
  recentLogs,
}: {
  recentLogs: {
    id: string;
    syncedAt: Date;
    matchesUpdated: number;
    success: boolean;
    error: string | null;
  }[];
}) {
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [apiStatus, setApiStatus] = useState<{ account: string; requests: { current: number; limit: number } } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isCheckingApi, startApiCheck] = useTransition();

  function handleSync() {
    startTransition(async () => {
      const result = await triggerSyncAction();
      setLastResult(result);
    });
  }

  function handleCheckApi() {
    startApiCheck(async () => {
      try {
        const status = await checkApiStatusAction();
        setApiStatus(status);
      } catch (e) {
        setApiStatus(null);
        alert(e instanceof Error ? e.message : "API check failed");
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* API status + trigger */}
      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={handleSync}
          disabled={isPending}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
        >
          {isPending ? "Syncing…" : "▶ Trigger Sync Now"}
        </button>
        <button
          onClick={handleCheckApi}
          disabled={isCheckingApi}
          className="border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          {isCheckingApi ? "Checking…" : "Check API Connection"}
        </button>
        {apiStatus && (
          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
            ✓ Connected · {apiStatus.requests.current}/{apiStatus.requests.limit} requests today
          </span>
        )}
      </div>

      {/* Last sync result */}
      {lastResult && (
        <div className={`rounded-lg border p-4 text-sm ${lastResult.error ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}>
          {lastResult.error ? (
            <p><strong>Sync failed:</strong> {lastResult.error}</p>
          ) : (
            <p>
              ✓ Sync complete — {lastResult.matchesUpserted} fixture{lastResult.matchesUpserted !== 1 ? "s" : ""} upserted,
              points recalculated.
            </p>
          )}
        </div>
      )}

      {/* Recent sync log */}
      {recentLogs.length > 0 && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Time</th>
                <th className="text-center px-4 py-2 text-gray-500 font-medium">Matches</th>
                <th className="text-center px-4 py-2 text-gray-500 font-medium">Status</th>
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-600">
                    {new Date(log.syncedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-center text-gray-600">{log.matchesUpdated}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${log.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {log.success ? "OK" : "Error"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-red-500 truncate max-w-xs">{log.error ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {recentLogs.length === 0 && (
        <p className="text-sm text-gray-400">No syncs run yet.</p>
      )}
    </div>
  );
}
