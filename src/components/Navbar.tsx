import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function Navbar() {
  const session = await auth();
  if (!session) return null;

  const [pendingTrades, me] = await Promise.all([
    prisma.trade.count({ where: { recipientId: session.user.id, status: "PENDING" } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { hasNotification: true } }),
  ]);

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-bold text-green-700 text-sm tracking-tight">
            ⚽ WC 2026
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
              My Teams
            </Link>
            <Link href="/leaderboard" className="text-gray-600 hover:text-gray-900 transition-colors hidden xs:block sm:block">
              Leaderboard
            </Link>
            <Link href="/trades" className="relative text-gray-600 hover:text-gray-900 transition-colors">
              Trades
              {pendingTrades > 0 && (
                <span className="absolute -top-1.5 -right-3 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {pendingTrades}
                </span>
              )}
            </Link>
            {session.user.role === "ADMIN" && (
              <Link href="/admin" className="text-purple-600 hover:text-purple-800 transition-colors font-medium">
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/account" className="relative text-xs text-gray-400 hidden sm:block hover:text-gray-700 transition-colors">
            {session.user.email}
            {me?.hasNotification && (
              <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 rounded-md px-3 py-1.5 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
