import { AuthRepository } from './auth.repository';

export class AuthService {
  private repository: AuthRepository;

  constructor() {
    this.repository = new AuthRepository();
  }

  async register(data: unknown) {
    // TODO: Implement register business logic
  }

  async login(email: string, password: string) {
    // TODO: Implement login business logic
  }

  async refreshToken(token: string) {
    // TODO: Implement refreshToken business logic
  }

  async logout(userId: string) {
    // TODO: Implement logout business logic
  }
}
