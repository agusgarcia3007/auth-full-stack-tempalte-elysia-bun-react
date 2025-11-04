import { http } from "@/lib/http";
import type {
  AuthResponse,
  LoginData,
  LogoutResponse,
  ProfileResponse,
  RefreshResponse,
  SignupData,
} from "./types";

export const authKeys = {
  all: ["auth"] as const,
  profile: () => [...authKeys.all, "profile"] as const,
};

export class AuthService {
  private static readonly BASE_URL = "/auth";

  public static async signup(data: SignupData): Promise<AuthResponse> {
    const response = await http.post<AuthResponse>(
      `${this.BASE_URL}/signup`,
      data
    );
    return response.data;
  }

  public static async login(data: LoginData): Promise<AuthResponse> {
    const response = await http.post<AuthResponse>(
      `${this.BASE_URL}/login`,
      data
    );
    return response.data;
  }

  public static async refresh(): Promise<RefreshResponse> {
    const response = await http.post<RefreshResponse>(
      `${this.BASE_URL}/refresh`,
      {}
    );
    return response.data;
  }

  public static async logout(): Promise<LogoutResponse> {
    const response = await http.post<LogoutResponse>(
      `${this.BASE_URL}/logout`,
      {}
    );
    this.removeAccessToken();
    this.removeRefreshToken();
    return response.data;
  }

  public static async getProfile(): Promise<ProfileResponse> {
    const response = await http.get<ProfileResponse>(
      `${this.BASE_URL}/profile`
    );
    return response.data;
  }

  public static setAccessToken(token: string): void {
    localStorage.setItem("accessToken", token);
  }

  public static removeAccessToken(): void {
    localStorage.removeItem("accessToken");
  }

  public static getAccessToken(): string | null {
    return localStorage.getItem("accessToken");
  }

  public static setRefreshToken(token: string): void {
    localStorage.setItem("refreshToken", token);
  }

  public static removeRefreshToken(): void {
    localStorage.removeItem("refreshToken");
  }

  public static getRefreshToken(): string | null {
    return localStorage.getItem("refreshToken");
  }
}
