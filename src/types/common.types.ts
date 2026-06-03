export interface PaginationQuery {
  page?: number;
  limit?: number;
  skip?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export interface RequestUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}
