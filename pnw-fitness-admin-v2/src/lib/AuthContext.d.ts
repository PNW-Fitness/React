import { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

export function AuthProvider(props: { children: ReactNode }): JSX.Element;
export function useAuth(): {
  session: Session | null | undefined;
  role: string | null | undefined;
};
