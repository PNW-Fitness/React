import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

export interface AuthContextValue {
  session: Session | null | undefined;
  role: string | null | undefined;
}

export function AuthProvider(props: { children: ReactNode }): JSX.Element;
export function useAuth(): AuthContextValue;
