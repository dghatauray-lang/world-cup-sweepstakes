"use client";

import { useState, useTransition } from "react";
import { updateProfileAction, changePasswordAction } from "./actions";

export function UpdateNameForm({ currentName }: { currentName: string }) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(currentName);
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateProfileAction(name);
      setMsg(result.error ? { error: result.error } : { ok: "Name updated." });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Display name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      {msg?.ok    && <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{msg.ok}</p>}
      {msg?.error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{msg.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        {isPending ? "Saving…" : "Save name"}
      </button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const current  = (form.elements.namedItem("current")  as HTMLInputElement).value;
    const next     = (form.elements.namedItem("next")     as HTMLInputElement).value;
    const confirm  = (form.elements.namedItem("confirm")  as HTMLInputElement).value;

    if (next !== confirm) return setMsg({ error: "New passwords don't match." });

    startTransition(async () => {
      const result = await changePasswordAction(current, next);
      if (result.error) {
        setMsg({ error: result.error });
      } else {
        setMsg({ ok: "Password changed." });
        form.reset();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Current password</label>
        <input name="current" type="password" required
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">New password</label>
        <input name="next" type="password" required minLength={8}
          placeholder="Min. 8 characters"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Confirm new password</label>
        <input name="confirm" type="password" required minLength={8}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      {msg?.ok    && <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{msg.ok}</p>}
      {msg?.error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{msg.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="text-sm bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        {isPending ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}
