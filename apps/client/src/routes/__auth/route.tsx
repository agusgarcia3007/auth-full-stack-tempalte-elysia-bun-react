import { createFileRoute, Outlet } from "@tanstack/react-router";

const AuthLayout = () => (
  <div className="min-h-screen flex items-center justify-center bg-muted/50">
    <div className="w-full max-w-md p-6">
      <Outlet />
    </div>
  </div>
);

export const Route = createFileRoute("/__auth")({ component: AuthLayout });
