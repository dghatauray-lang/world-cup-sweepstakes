import { signIn } from "@/lib/auth";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">⚽ WC 2026 Sweepstakes</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Enter your email to sign in</p>
        <form
          action={async (formData: FormData) => {
            "use server";
            await signIn("resend", formData);
          }}
        >
          <input
            name="email"
            type="email"
            required
            placeholder="you@company.com"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
          >
            Send magic link
          </button>
        </form>
      </div>
    </main>
  );
}
