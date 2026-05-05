"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUserAction, deleteUserAction } from "./actions";

type User = { id: string; name: string | null; email: string; role: string };

function AddUserForm({ onDone }: { onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail]       = useState("");
  const [name, setName]         = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]         = useState<"USER" | "ADMIN">("USER");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createUserAction({ email, name, password, role });
      if (result.error) { setError(result.error); return; }
      router.refresh();
      onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 p-4 space-y-3 bg-gray-50">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder="jane@example.com"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            placeholder="Temporary password"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Role</label>
          <select value={role} onChange={e => setRole(e.target.value as "USER" | "ADMIN")}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5">
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={isPending}
          className="text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors">
          {isPending ? "Creating…" : "Create User"}
        </button>
        <button type="button" onClick={onDone}
          className="text-sm text-gray-500 hover:text-gray-800 px-4 py-1.5 rounded-lg border border-gray-200 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function UsersPanel({ users }: { users: User[] }) {
  const [showAdd, setShowAdd]     = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError]         = useState<string | null>(null);
  const router = useRouter();

  function handleDelete(user: User) {
    if (!confirm(`Remove ${user.name ?? user.email}? This will also remove their team assignments.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteUserAction(user.id);
      if (result.error) { setError(result.error); return; }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {!showAdd ? (
        <button onClick={() => setShowAdd(true)}
          className="text-sm bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">
          + Add User
        </button>
      ) : (
        <AddUserForm onDone={() => setShowAdd(false)} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {(u.name ?? u.email)[0].toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{u.name ?? "—"}</p>
              <p className="text-gray-400 text-xs truncate">{u.email}</p>
            </div>
            {u.role === "ADMIN" && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex-shrink-0">Admin</span>
            )}
            <button
              onClick={() => handleDelete(u)}
              disabled={isPending}
              className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors flex-shrink-0 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
