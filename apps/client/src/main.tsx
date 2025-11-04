import { StrictMode, useMemo } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Import styles
import "./index.css";

// Import i18n configuration
import "./i18n/config";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { Toaster } from "./components/ui/sonner";
import { AuthService } from "./services/auth/service";
import type { User } from "./services/auth/types";
import type { RouterContext } from "./routes/__root";

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    auth: {
      isAuthenticated: false,
      user: null,
    },
  } satisfies RouterContext,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: false,
    },
  },
});

function InnerApp() {
  const auth = useMemo(() => {
    const token = AuthService.getAccessToken();
    const isAuthenticated = !!token;

    // Try to get user from profile query cache
    const userCache = queryClient.getQueryData<{ success: boolean; data: { user: User } }>(["auth", "profile"]);

    return {
      isAuthenticated,
      user: userCache?.data?.user || null,
    };
  }, []);

  return <RouterProvider router={router} context={{ auth }} />;
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <InnerApp />
        <Toaster />
      </QueryClientProvider>
    </StrictMode>
  );
}
