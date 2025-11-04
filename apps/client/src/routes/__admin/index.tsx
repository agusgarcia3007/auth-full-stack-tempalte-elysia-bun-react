import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/__admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6">{t("navigation.admin")}</h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.users")}</CardTitle>
            <CardDescription>{t("admin.users_description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">-</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.activity")}</CardTitle>
            <CardDescription>{t("admin.activity_description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">-</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.settings")}</CardTitle>
            <CardDescription>{t("admin.settings_description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">-</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
