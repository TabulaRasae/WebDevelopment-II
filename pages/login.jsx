import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import AuthShell from "../components/AuthShell";
import { withSessionSsr } from "../lib/session";

export const getServerSideProps = withSessionSsr(async ({ req, query }) => {
  if (req.session?.userId) {
    return {
      redirect: { destination: "/", permanent: false },
    };
  }

  return {
    props: {
      message: query.message || "",
      isError: query.isError === "true",
    },
  };
});

export default function Login({ message = "", isError = false }) {
  const router = useRouter();
  const [status, setStatus] = useState({ message, isError });
  const [form, setForm] = useState({ userid: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ message: "", isError: false });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Login failed.");
      }
      router.push("/");
    } catch (error) {
      setStatus({ message: error.message, isError: true });
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Login | BMCC UsedBooks Store"
      kicker="BMCC Used Books"
      heroTitle="Verified textbooks, student-to-student"
      heroLede="Reserve titles, pick them up on campus, and keep your studies moving."
    >
      <div className="space-y-4 reveal-up">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
          <p className="text-slate-600">
            Use your BMCC username to browse used textbooks, reserve copies, and
            keep your cart synced across sessions.
          </p>
        </div>
        {status.message ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              status.isError
                ? "border-red-400 bg-red-500/10 text-red-100"
                : "border-accent-500/50 bg-accent-600/10 text-accent-100"
            }`}
          >
            {status.message}
          </div>
        ) : null}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-1">
            <span className="label">Username</span>
            <input
              className="input"
              type="text"
              name="userid"
              required
              value={form.userid}
              onChange={(e) => setForm({ ...form, userid: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="label">Password</span>
            <input
              className="input"
              type="password"
              name="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>
        <p className="text-sm text-slate-300">
          Need an account?{" "}
          <Link className="text-accent-100 underline" href="/register">
            Register here
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
