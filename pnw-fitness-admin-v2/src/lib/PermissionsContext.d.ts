import { ReactNode } from "react";

export function PermissionsProvider(props: { children: ReactNode }): JSX.Element;
export function usePermissions(): {
  permissions: string[];
  rbacRoleName: string | null;
  permissionsReady: boolean;
  can: (key: string) => boolean;
};
