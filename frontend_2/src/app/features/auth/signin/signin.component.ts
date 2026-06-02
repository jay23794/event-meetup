import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

interface SignInQueryParams {
  error: string | null;
  jwt: string | null;
  email: string | null;
  name: string | null;
  returnUrl: string | undefined;
}

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './signin.component.html',
})
export class SignInComponent implements OnInit {
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const { error, jwt, email, name, returnUrl } = this.readQueryParams(
      this.route.snapshot.queryParamMap,
    );

    if (error) {
      this.errorMessage.set(error);
      return;
    }

    if (jwt && email && name) {
      this.authService.handleOAuthCallback(jwt, email, name, returnUrl);
    }
  }

  private readQueryParams(params: ParamMap): SignInQueryParams {
    return {
      error: params.get('error'),
      jwt: params.get('jwt'),
      email: params.get('email'),
      name: params.get('name'),
      returnUrl: params.get('returnUrl') ?? undefined,
    };
  }

  onGoogleSignIn(): void {
    this.errorMessage.set(null);
    this.loading.set(true);
    this.authService.loginWithGoogle();
  }
}
