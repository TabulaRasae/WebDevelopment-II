import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import AuthShell from "../components/AuthShell";
import { withSessionSsr } from "../lib/session";

export const getServerSideProps = withSessionSsr(async ({ req }) => {
  if (req.session?.userId) {
    return {
      redirect: { destination: "/", permanent: false },
    };
  }

  return { props: {} };
});

export default function Register() {
  const router = useRouter();
  const [status, setStatus] = useState({ message: "", isError: false });
  const [form, setForm] = useState({
    userid: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ message: "", isError: false });
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Registration failed.");
      }
      router.push(
        "/login?message=Registration%20successful.%20Please%20log%20in.&isError=false"
      );
    } catch (error) {
      setStatus({ message: error.message, isError: true });
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Register | BMCC UsedBooks Store"
      kicker="BMCC Used Books"
      heroTitle="List, reserve, and trade confidently"
      heroLede="Join the campus community to share textbooks and keep learning affordable."
    >
      <div className="space-y-4 reveal-up">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Create an account</h1>
          <p className="text-slate-600">
            Register with your BMCC username to list books, reserve titles, and
            keep your cart saved between visits.
          </p>
        </div>
        {status.message ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              status.isError
                ? "border-red-400 bg-red-500/10 text-red-100"
                : "border-accent-500/50 bg-accent-600/10 text-sky-700"
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
          <label className="block space-y-1">
            <span className="label">Confirm Password</span>
            <input
              className="input"
              type="password"
              name="confirmPassword"
              required
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
            />
          </label>
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? "Creating account..." : "Register"}
          </button>
        </form>
        <p className="text-sm text-slate-300">
          Already registered?{" "}
          <Link className="text-sky-700 underline" href="/login">
            Log in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
