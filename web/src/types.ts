export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

// Design System Types
export type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
export type Size = 'sm' | 'md' | 'lg';
