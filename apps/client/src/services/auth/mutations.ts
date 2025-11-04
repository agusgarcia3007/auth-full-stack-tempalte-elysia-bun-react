import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AuthService, authKeys } from "./service";
import type { LoginData, SignupData } from "./types";
import { catchAxiosError } from "@/lib/catch-axios-error";

export function useSignup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SignupData) => AuthService.signup(data),
    onSuccess: (response) => {
      AuthService.setAccessToken(response.data.accessToken);
      AuthService.setRefreshToken(response.data.refreshToken);
      queryClient.setQueryData(authKeys.profile(), response);
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: catchAxiosError,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginData) => AuthService.login(data),
    onSuccess: (response) => {
      AuthService.setAccessToken(response.data.accessToken);
      AuthService.setRefreshToken(response.data.refreshToken);
      queryClient.setQueryData(authKeys.profile(), response);
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: catchAxiosError,
  });
}

export function useRefresh() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => AuthService.refresh(),
    onSuccess: (response) => {
      AuthService.setAccessToken(response.data.accessToken);
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    onError: catchAxiosError,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => AuthService.logout(),
    onSuccess: () => {
      AuthService.removeAccessToken();
      AuthService.removeRefreshToken();
      queryClient.clear();
      navigate({ to: "/login" });
    },
    onError: catchAxiosError,
  });
}
