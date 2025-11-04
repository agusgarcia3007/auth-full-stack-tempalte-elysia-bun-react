import { createFileRoute, redirect } from "@tanstack/react-router";
import { useProfile } from "@/services/auth/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/profile")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useTranslation();
  const { data, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const user = data?.data?.user;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{t("navigation.profile")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.user_information")}</CardTitle>
          <CardDescription>{t("profile.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              {t("auth.signup.name")}
            </label>
            <p className="text-lg">{user?.name || "-"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              {t("auth.signup.email")}
            </label>
            <p className="text-lg">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              {t("profile.role")}
            </label>
            <p className="text-lg capitalize">{user?.role}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
