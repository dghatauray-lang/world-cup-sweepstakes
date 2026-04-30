import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { UpdateNameForm, ChangePasswordForm } from "./AccountForms";

const STATUS_STYLES: Record<string, string> = {
  PENDING:  "bg-yellow-100 text-yellow-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
  VETOED:   "bg-gray-100 text-gray-500",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:  "Pending your response",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  VETOED:   "Vetoed by admin",
};

export default async function AccountPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [user, trades] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, createdAt: true, role: true },
    }),
    prisma.trade.findMany({
      where: { OR: [{ proposerId: session.user.id }, { recipientId: session.user.id }] },
      include: {
        proposer:  { select: { id: true, name: true, email: true } },
        recipient: { select: { id: true, name: true, email: true } },
        items: { include: { team: { select: { name: true, tier: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  if (!user) redirect("/login");

  const myId = session.user.id;

  const activity = trades.map((t) => {
    const iProposed = t.proposerId === myId;
    const other = iProposed ? t.recipient : t.proposer;
    const otherName = other.name ?? other.email;
    const offeredTeams   = t.items.filter((i) => i.direction === "OFFERED").map((i) => i.team.name);
    const requestedTeams = t.items.filter((i) => i.direction === "REQUESTED").map((i) => i.team.name);

    let summary = "";
    if (iProposed) {
      summary = `You proposed a trade to ${otherName} — offering ${offeredTeams.join(", ")} for ${requestedTeams.join(", ")}`;
    } else {
      summary = `${otherName} proposed a trade — offering ${offeredTeams.join(", ")} for ${requestedTeams.join(", ")}`;
    }

    return { id: t.id, summary, status: t.status, createdAt: t.createdAt };
  });

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-10 space-y-10">
        <h1 className="text-3xl font-bold">My Account</h1>

        {/* Profile info */}
        <section className="rounded-xl border border-gray-200 p-6 space-y-1">
          <p className="text-sm text-gray-500">Signed in as</p>
          <p className="font-semibold">{user.email}</p>
          <p className="text-xs text-gray-400">
            Member since {new Date(user.createdAt).toLocaleDateString()}
            {user.role === "ADMIN" && (
              <span className="ml-2 bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">Admin</span>
            )}
          </p>
        </section>

        {/* Update name */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Display Name</h2>
          <UpdateNameForm currentName={user.name ?? ""} />
        </section>

        {/* Change password */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Change Password</h2>
          <ChangePasswordForm />
        </section>

        {/* Trade activity */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Trade Activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-gray-400">No trade activity yet.</p>
          ) : (
            <div className="space-y-2">
              {activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-xl border border-gray-100 p-4">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${STATUS_STYLES[a.status] ?? "bg-gray-100"}`}>
                    {STATUS_LABEL[a.status] ?? a.status}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{a.summary}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
