import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useLogin } from "@/services/auth/mutations";
import type { LoginData } from "@/services/auth/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ from: "/__auth/login" });
  const { mutate: login, isPending } = useLogin();

  const form = useForm<LoginData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginData) => {
    login(data, {
      onSuccess: () => {
        const redirect = (search as { redirect?: string })?.redirect || "/";
        navigate({ to: redirect });
      },
    });
  };

  return (
    <div className="bg-card rounded-lg border p-8 shadow-sm">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {t("auth.login.title")}
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.login.email")}</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.login.password")}</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" isLoading={isPending}>
            {t("auth.login.submit")}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground mt-4">
        <Link to="/signup" className="text-primary hover:underline">
          {t("auth.login.signup_link")}
        </Link>
      </p>
    </div>
  );
};

export const Route = createFileRoute("/__auth/login")({ component: LoginPage });
