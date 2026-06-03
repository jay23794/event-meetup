import { User, IUser } from '@/model/auth.model';
import { handleMongooseError } from '@/errors';

export class AuthRepository {
  async findUserByEmail(email: string): Promise<IUser | null> {
    try {
      return await User.findOne({ email }).select('+password');
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async createUser(userData: { email: string; password: string; name: string }): Promise<IUser> {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async updateUser(id: string, userData: Partial<IUser>): Promise<IUser | null> {
    try {
      return await User.findByIdAndUpdate(id, userData, { new: true });
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async deleteUser(id: string): Promise<IUser | null> {
    try {
      return await User.findByIdAndDelete(id);
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async findUserById(id: string): Promise<IUser | null> {
    try {
      return await User.findById(id);
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async findUserByIdWithRefreshToken(id: string): Promise<IUser | null> {
    try {
      return await User.findById(id).select('+googleRefreshToken');
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async findUserByIdWithRefreshTokenAndRoot(id: string): Promise<IUser | null> {
    try {
      return await User.findById(id).select('+googleRefreshToken meetSyncRootFolderId');
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async findVisitorByIdForDriveShare(id: string): Promise<IUser | null> {
    try {
      return await User.findById(id).select(
        '+googleRefreshToken meetSyncRootFolderId visitedBoothsFolderId'
      );
    } catch (error) {
      throw handleMongooseError(error);
    }
  }

  async updateFolderIdsById(
    id: string,
    folders: { meetSyncRootFolderId?: string; visitedBoothsFolderId?: string }
  ): Promise<void> {
    try {
      await User.updateOne({ _id: id }, folders);
    } catch (error) {
      throw handleMongooseError(error);
    }
  }
}

export const authRepository = new AuthRepository();
