import { userService } from '@/services/userService';
import api from '@/services/api';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock the api module
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should call api.post with correct endpoint and credentials', async () => {
      const mockCredentials = { username: 'testuser', password: 'password123' };
      const mockResponse = { data: 'mock login response' };
      
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await userService.login(mockCredentials);

      expect(api.post).toHaveBeenCalledWith('/users/login', mockCredentials);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('register', () => {
    it('should call api.post with correct endpoint and user data', async () => {
      const mockUserData = { 
        username: 'newuser', 
        email: 'newuser@example.com', 
        password: 'password123' 
      };
      const mockResponse = { data: 'mock register response' };
      
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await userService.register(mockUserData);

      expect(api.post).toHaveBeenCalledWith('/users/register', mockUserData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getProfile', () => {
    it('should call api.get with correct endpoint', async () => {
      const mockResponse = { data: 'mock profile response' };
      
      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await userService.getProfile();

      expect(api.get).toHaveBeenCalledWith('/users/profile');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getAllUsers', () => {
    it('should call api.get with correct endpoint', async () => {
      const mockResponse = { data: 'mock users response' };
      
      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await userService.getAllUsers();

      expect(api.get).toHaveBeenCalledWith('/admin/users');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteUser', () => {
    it('should call api.delete with correct endpoint and userId', async () => {
      const userId = 123;
      const mockResponse = { data: 'mock delete response' };
      
      vi.mocked(api.delete).mockResolvedValue(mockResponse);

      const result = await userService.deleteUser(userId);

      expect(api.delete).toHaveBeenCalledWith(`/admin/users/${userId}`);
      expect(result).toEqual(mockResponse);
    });
  });
});