"use client";

import { useState, useTransition } from "react";
import { resetDraftAction } from "./actions";

export default function ResetDraftButton() {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-sm border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
      >
        Reset Draft
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
      <p className="text-sm text-red-700 font-medium">
        This will delete all team assignments and trades. Are you sure?
      </p>
      <button
        onClick={() => startTransition(async () => { await resetDraftAction(); })}
        disabled={isPending}
        className="text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors flex-shrink-0"
      >
        {isPending ? "Resetting…" : "Yes, reset"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        disabled={isPending}
        className="text-sm text-gray-500 hover:text-gray-800 flex-shrink-0"
      >
        Cancel
      </button>
    </div>
  );
}
