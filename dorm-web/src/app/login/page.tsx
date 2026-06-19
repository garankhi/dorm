"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setError(payload?.error ?? `Login failed (${res.status})`);
        setLoading(false);
        return;
      }

      const data = await res.json();
      const token = data.token ?? data.Token;
      const role = data.role ?? data.Role;
      if (!token) {
        setError("No token returned from server");
        setLoading(false);
        return;
      }

      localStorage.setItem("sdms_token", token);

      // redirect by role
      if (role === "admin") router.push("/admin");
      else router.push("/student");
    } catch (ex: any) {
      setError(ex?.message ?? String(ex));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
        <label className="block mb-2">
          <span className="text-sm">Email</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 block w-full border rounded px-3 py-2" />
        </label>
        <label className="block mb-4">
          <span className="text-sm">Password</span>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 block w-full border rounded px-3 py-2" />
        </label>
        <button disabled={loading} type="submit" className="w-full bg-black text-white py-2 rounded">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
