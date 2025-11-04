import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { User } from "@/services/auth/types";
import { Header } from "@/components/header";

export interface RouterContext {
  auth: {
    isAuthenticated: boolean;
    user: User | null;
  };
}

function RootLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});
