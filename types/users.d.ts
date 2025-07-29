type Language = {
  language: string;
  level: 1 | 2 | 3 | 4
}

export interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  bio: string;
  nativeLanguage: string;
  spokenlanguages: Language[]
  interests: string[];
  postIds: string[];
  followersCount: number;
  followingCount: number;
  avatarUrl?: string;
  createdAt: string;
  udpatedAt: string;
  premiumMember: string;
  role: "user" | "admin"
}