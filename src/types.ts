export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
  about?: string;
  status?: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  createdBy: string;
  createdAt: any;
  lastMessage?: string;
  lastMessageTime?: any;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  createdAt: any;
  groupId: string;
  imageUrl?: string;
}

export interface Membership {
  userId: string;
  groupId: string;
  role: 'admin' | 'member';
  joinedAt: any;
}
