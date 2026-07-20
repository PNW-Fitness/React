import { useState, useEffect, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../lib/AuthContext";

export default function SignInForm() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const timedOut = searchParams.get("timeout") === "1";

  const [showPassword, setShowPassword] = useState(false);
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
    // Accounts created with a plain username get @pnwfitness.app appended.
    // Real email accounts (invite flow) are used as-is.
    const email = username.includes("@") ? username : `${username}@pnwfitness.app`;
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      navigate("/", { replace: true });
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              PNW Fitness
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Admin Portal — sign in with your staff account
            </p>
          </div>

          {timedOut && (
            <p className="mb-5 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400">
              Your session timed out due to inactivity. Please sign in again.
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>
                  Username or email <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
              </div>

              {error && (
                <p className="text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg px-3 py-2 dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400">
                  {error}
                </p>
              )}

              <div>
                <Button className="w-full" size="sm" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
