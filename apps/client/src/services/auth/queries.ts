import { useQuery } from "@tanstack/react-query";
import { AuthService, authKeys } from "./service";

export function useProfile() {
  const accessToken = AuthService.getAccessToken();

  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => AuthService.getProfile(),
    enabled: !!accessToken,
  });
}
