export type UserActivity = {
  hasCreatedBooth: boolean;
  hasScannedBooth: boolean;
};

export type UserDriveFolders = {
  meetSyncRootFolderId?: string;
  myBoothsFolderId?: string;
  visitedBoothsFolderId?: string;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  activity: UserActivity;
  driveFolders: UserDriveFolders;
  lastActiveAt?: Date;
};
