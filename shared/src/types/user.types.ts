export interface ParentUser {
  id: string;
  _id?: string;
  email: string;
  displayName: string;
  firebaseUid?: string;
  children: string[];
  createdAt: Date;
}

export interface Child {
  id: string;
  parentId: string;
  displayName: string;
  avatarUrl: string;
  grade: string;
}

export interface DeviceSession {
  id: string;
  parentId: string;
  childId?: string;
  sessionToken: string;
  qrData: string;
  expiresAt: Date;
  isActive: boolean;
  deviceInfo?: string;
}
