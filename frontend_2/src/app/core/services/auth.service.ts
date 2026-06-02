import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@env/environment';

interface StoredUser {
  email: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  isAuthenticated = signal(false);
  user = signal<StoredUser | null>(null);

  constructor(private router: Router) {
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      this.isAuthenticated.set(true);
      const raw = localStorage.getItem(this.USER_KEY);
      if (raw) {
        try {
          this.user.set(JSON.parse(raw) as StoredUser);
        } catch {
          this.user.set(null);
        }
      }
    }
  }

  loginWithGoogle(): void {
    const origin = window.location.origin;
    const apiBase = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
    const url = `${apiBase}/auth/google?origin=${encodeURIComponent(origin)}`;
    window.location.href = url;
  }

  handleOAuthCallback(token: string, email: string, name: string, returnUrl?: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    const user: StoredUser = { email, name };
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.user.set(user);
    this.isAuthenticated.set(true);
    this.router.navigateByUrl(returnUrl || '/home');
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.isAuthenticated.set(false);
    this.user.set(null);
    this.router.navigate(['/signin']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
