import api from './api';
import { LoginCredentials, AuthResponse, User, UserCreate, UserUpdate } from '../types/auth';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  }

  async getUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/users/');
    return response.data;
  }

  async createUser(userData: UserCreate): Promise<User> {
    const response = await api.post<User>('/auth/signup', userData);
    return response.data;
  }

  async updateUser(userId: number, userData: UserUpdate): Promise<User> {
    const response = await api.put<User>(`/users/${userId}`, userData);
    return response.data;
  }

  async deleteUser(userId: number): Promise<void> {
    await api.delete(`/users/${userId}`);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export const authService = new AuthService(); 