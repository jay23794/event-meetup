import { AuthRepository } from './auth.repository';
import { ApiError } from '@/shared/utils/ApiError';
import { generateToken } from '@/shared/utils/jwt';
import { RegisterInput, LoginInput } from './auth.schema';

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
}

export class AuthService {
  private repository: AuthRepository;

  constructor() {
    this.repository = new AuthRepository();
  }

  async register(data: RegisterInput) {
    const existingUser = await this.repository.findUserByEmail(data.email);
    if (existingUser) {
      throw ApiError.conflict('User already exists');
    }

    const user = await this.repository.createUser({
      email: data.email,
      password: data.password,
      name: data.name,
    });

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return { user: { id: user._id, email: user.email, name: user.name }, token };
  }

  async login(email: string, password: string) {
    const user = await this.repository.findUserByEmail(email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return { user: { id: user._id, email: user.email, name: user.name }, token };
  }

  async googleSignIn(googleUserInfo: GoogleUserInfo, refreshToken: string) {
    let user = await this.repository.findUserByEmail(googleUserInfo.email);

    if (!user) {
      user = await this.repository.createUser({
        email: googleUserInfo.email,
        name: googleUserInfo.name,
        password: Math.random().toString(36).slice(2),
      });
    }

    await this.repository.updateUser(user._id.toString(), {
      googleRefreshToken: refreshToken,
    });

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return {
      user: { id: user._id, email: user.email, name: user.name },
      token,
    };
  }

  async logout(_userId: string) {
    return { message: 'Logged out successfully' };
  }
}
