import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSignup } from "@/services/auth/mutations";
import type { SignupData } from "@/services/auth/types";
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

const SignupPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ from: "/__auth/signup" });
  const { mutate: signup, isPending } = useSignup();

  const form = useForm<SignupData>({
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  const onSubmit = (data: SignupData) => {
    signup(data, {
      onSuccess: () => {
        const redirect = (search as { redirect?: string })?.redirect || "/";
        navigate({ to: redirect });
      },
    });
  };

  return (
    <div className="bg-card rounded-lg border p-8 shadow-sm">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {t("auth.signup.title")}
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.signup.name")}</FormLabel>
                <FormControl>
                  <Input type="text" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.signup.email")}</FormLabel>
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
                <FormLabel>{t("auth.signup.password")}</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" isLoading={isPending}>
            {t("auth.signup.submit")}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground mt-4">
        <Link to="/login" className="text-primary hover:underline">
          {t("auth.signup.login_link")}
        </Link>
      </p>
    </div>
  );
};

export const Route = createFileRoute("/__auth/signup")({
  component: SignupPage,
});
