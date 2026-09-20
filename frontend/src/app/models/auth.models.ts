export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  requiresTwoFactor: boolean;
  accessToken: string | null;
  challengeToken: string | null;
  expiresAtUtc: string | null;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
}

export interface MessageResponse {
  message: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  otpAuthUri: string;
  qrCodeDataUrl: string;
}

export interface VerifyTwoFactorRequest {
  challengeToken: string;
  twoFactorCode: string;
}

export interface EnableTwoFactorRequest {
  twoFactorCode: string;
}

export interface LockoutResponse {
  message: string;
  lockoutEndUtc?: string;
}
