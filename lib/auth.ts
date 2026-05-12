import Cookies from './cookies';

export interface UserData {
  id: string;
  type: string;
  attributes: {
    first_name: string;
    last_name: string;
    phone: number;
    role: string;
    email: string;
    email_verified_at: string;
    created_at: string;
    updated_at: string;
  };
}

export interface AuthMeta {
  token: string;
  token_type: string;
  expires_at: string;
  logged_by: string;
}

export interface LoginResponse {
  data: UserData;
  meta: AuthMeta;
}

export function getToken(): string | undefined {
  return Cookies.get('token');
}

export function getUserRole(): string | undefined {
  return Cookies.get('user_role');
}

export function getUserData(): UserData | null {
  const userData = Cookies.get('user_data');
  if (userData) {
    try {
      return JSON.parse(userData) as UserData;
    } catch {
      return null;
    }
  }
  return null;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function isAdmin(): boolean {
  return getUserRole() === 'Admin';
}

export function isInstructor(): boolean {
  return getUserRole() === 'Instructor';
}

export function isDoctor(): boolean {
  return getUserRole() === 'Doctor';
}

export function logout(): void {
  Cookies.remove('token');
  Cookies.remove('user_role');
  Cookies.remove('user_data');
  window.location.href = '/login';
}
