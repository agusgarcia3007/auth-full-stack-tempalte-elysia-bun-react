import { Link, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LogOut, ShieldCheck, User as UserIcon } from "lucide-react";
import type { User } from "@/services/auth/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLogout } from "@/services/auth/mutations";

export function Header() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mutate: logout } = useLogout();
  const { auth } = router.options.context;

  const handleLogout = () => {
    logout();
  };

  const getUserInitials = (user: User | null) => {
    if (!user) return "U";
    if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email[0].toUpperCase();
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold">
            App
          </Link>
          <nav className="flex gap-4">
            <Link to="/" className="[&.active]:font-bold hover:text-primary transition-colors">
              {t("navigation.home")}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {auth.isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback>{getUserInitials(auth.user)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{auth.user?.name || t("navigation.account")}</p>
                    <p className="text-xs leading-none text-muted-foreground">{auth.user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    {t("navigation.profile")}
                  </Link>
                </DropdownMenuItem>
                {auth.user?.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link to="/__admin" className="cursor-pointer">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      {t("navigation.admin")}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} variant="destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("navigation.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">{t("navigation.login")}</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">{t("navigation.signup")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
