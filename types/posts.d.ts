type Comment = {
  _id: string;
  content: string;
  postId: number;
  userId: string;
  createdAt: string;
}

export interface Post {
  _id: string;
  content: string;
  userId: string;
  userLikeIds: string[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}