import type { ReactNode } from "react";

export interface PermissionsContextValue {
  permissions: string[];
  rbacRoleName: string | null;
  permissionsReady: boolean;
  can: (key: string) => boolean;
}

export function PermissionsProvider(props: { children: ReactNode }): JSX.Element;
export function usePermissions(): PermissionsContextValue;
