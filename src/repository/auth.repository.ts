import { User, IUser } from '@/model/auth.model';

export class AuthRepository {
  async findUserByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email }).select('+password');
  }

  async createUser(userData: { email: string; password: string; name: string }): Promise<IUser> {
    const user = new User(userData);
    return user.save();
  }

  async updateUser(id: string, userData: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, userData, { new: true });
  }

  async deleteUser(id: string): Promise<IUser | null> {
    return User.findByIdAndDelete(id);
  }

  async findUserById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findUserByIdWithRefreshToken(id: string): Promise<IUser | null> {
    return User.findById(id).select('+googleRefreshToken');
  }
}

export const authRepository = new AuthRepository();
