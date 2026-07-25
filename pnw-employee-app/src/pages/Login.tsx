import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) navigate("/", { replace: true });
  }, [session, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    // Same convention as the admin dashboard: plain usernames get
    // @pnwfitness.app appended, real email addresses are used as-is.
    const email = username.includes("@") ? username : `${username}@pnwfitness.app`;
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError(err.message);
    else navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 bg-navy">
      <div className="max-w-sm mx-auto w-full">
        <p className="text-gold font-bold tracking-widest text-xs mb-1">PNW FITNESS</p>
        <h1 className="text-white text-2xl font-bold mb-8">Team Sign In</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Username or email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full h-12 rounded-xl px-4 bg-white/10 text-white placeholder-white/30 border border-white/15 focus:outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 rounded-xl px-4 bg-white/10 text-white placeholder-white/30 border border-white/15 focus:outline-none focus:border-gold"
            />
          </div>

          {error && (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-gold text-navy font-bold disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
