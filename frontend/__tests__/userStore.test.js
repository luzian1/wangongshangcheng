import { createPinia, setActivePinia } from 'pinia';
import { useUserStore } from '@/stores/user';
import { userService } from '@/services/userService';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock the userService
vi.mock('@/services/userService', () => ({
  userService: {
    login: vi.fn(),
    register: vi.fn(),
    getProfile: vi.fn(),
    getAllUsers: vi.fn(),
    deleteUser: vi.fn(),
  }
}));

describe('User Store', () => {
  let userStore;

  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    const pinia = createPinia();
    setActivePinia(pinia);
    userStore = useUserStore();
    
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with default values', () => {
      expect(userStore.user).toBeNull();
      expect(userStore.token).toBeNull();
      expect(userStore.isAuthenticated).toBe(false);
    });

    it('should initialize from localStorage if available', () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: 1, username: 'testuser', role: 'buyer' }));
      
      const pinia = createPinia();
      setActivePinia(pinia);
      const store = useUserStore();
      
      expect(store.token).toBe('test-token');
      expect(store.user).toEqual({ id: 1, username: 'testuser', role: 'buyer' });
      expect(store.isAuthenticated).toBe(true);
    });
  });

  describe('getters', () => {
    it('currentUser should return the current user', () => {
      userStore.user = { id: 1, username: 'testuser' };
      expect(userStore.currentUser).toEqual({ id: 1, username: 'testuser' });
    });

    it('isLoggedIn should return true when token exists', () => {
      userStore.token = 'test-token';
      expect(userStore.isLoggedIn).toBe(true);
    });

    it('isLoggedIn should return false when token does not exist', () => {
      userStore.token = null;
      expect(userStore.isLoggedIn).toBe(false);
    });

    it('userRole should return the user role', () => {
      userStore.user = { id: 1, username: 'testuser', role: 'admin' };
      expect(userStore.userRole).toBe('admin');
    });

    it('userRole should return null when user does not exist', () => {
      userStore.user = null;
      expect(userStore.userRole).toBeNull();
    });
  });

  describe('actions', () => {
    describe('login', () => {
      it('should login successfully and update state', async () => {
        const mockResponse = {
          data: {
            token: 'test-token',
            user: { id: 1, username: 'testuser', role: 'buyer' }
          }
        };
        
        vi.mocked(userService.login).mockResolvedValue(mockResponse);

        const result = await userStore.login({ username: 'testuser', password: 'password' });

        expect(userService.login).toHaveBeenCalledWith({ username: 'testuser', password: 'password' });
        expect(result.success).toBe(true);
        expect(userStore.token).toBe('test-token');
        expect(userStore.user).toEqual({ id: 1, username: 'testuser', role: 'buyer' });
        expect(userStore.isAuthenticated).toBe(true);
        expect(localStorage.getItem('token')).toBe('test-token');
        expect(localStorage.getItem('user')).toBe(JSON.stringify({ id: 1, username: 'testuser', role: 'buyer' }));
      });

      it('should handle login failure', async () => {
        const mockError = {
          response: {
            data: {
              message: 'Invalid credentials'
            }
          }
        };
        
        vi.mocked(userService.login).mockRejectedValue(mockError);

        const result = await userStore.login({ username: 'testuser', password: 'wrongpassword' });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid credentials');
        expect(userStore.token).toBeNull();
        expect(userStore.user).toBeNull();
        expect(userStore.isAuthenticated).toBe(false);
      });
    });

    describe('register', () => {
      it('should register successfully', async () => {
        const mockResponse = {
          data: { message: 'Registration successful' }
        };
        
        vi.mocked(userService.register).mockResolvedValue(mockResponse);

        const result = await userStore.register({ 
          username: 'newuser', 
          email: 'newuser@example.com', 
          password: 'password123' 
        });

        expect(userService.register).toHaveBeenCalledWith({ 
          username: 'newuser', 
          email: 'newuser@example.com', 
          password: 'password123' 
        });
        expect(result.success).toBe(true);
        expect(result.data).toEqual({ message: 'Registration successful' });
      });

      it('should handle registration failure', async () => {
        const mockError = {
          response: {
            data: {
              message: 'Username already exists'
            }
          }
        };
        
        vi.mocked(userService.register).mockRejectedValue(mockError);

        const result = await userStore.register({ 
          username: 'existinguser', 
          email: 'existing@example.com', 
          password: 'password123' 
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Username already exists');
      });
    });

    describe('fetchProfile', () => {
      it('should fetch profile successfully when authenticated', async () => {
        userStore.token = 'test-token';
        const mockResponse = {
          data: {
            user: { id: 1, username: 'testuser', role: 'buyer' }
          }
        };
        
        vi.mocked(userService.getProfile).mockResolvedValue(mockResponse);

        const result = await userStore.fetchProfile();

        expect(userService.getProfile).toHaveBeenCalled();
        expect(result.success).toBe(true);
        expect(userStore.user).toEqual({ id: 1, username: 'testuser', role: 'buyer' });
        expect(userStore.isAuthenticated).toBe(true);
      });

      it('should fail to fetch profile when not authenticated', async () => {
        userStore.token = null;

        const result = await userStore.fetchProfile();

        expect(result.success).toBe(false);
        expect(result.error).toBe('未认证');
        expect(userService.getProfile).not.toHaveBeenCalled();
      });

      it('should handle fetch profile failure', async () => {
        userStore.token = 'test-token';
        const mockError = {
          response: {
            data: {
              message: 'Profile not found'
            }
          }
        };
        
        vi.mocked(userService.getProfile).mockRejectedValue(mockError);

        const result = await userStore.fetchProfile();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Profile not found');
        expect(userStore.user).toBeNull();
        expect(userStore.isAuthenticated).toBe(false);
        expect(userStore.token).toBeNull();
      });
    });

    describe('logout', () => {
      it('should clear user data and localStorage', () => {
        userStore.user = { id: 1, username: 'testuser', role: 'buyer' };
        userStore.token = 'test-token';
        userStore.isAuthenticated = true;
        localStorage.setItem('token', 'test-token');
        localStorage.setItem('user', JSON.stringify({ id: 1, username: 'testuser', role: 'buyer' }));

        userStore.logout();

        expect(userStore.user).toBeNull();
        expect(userStore.token).toBeNull();
        expect(userStore.isAuthenticated).toBe(false);
        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
      });
    });

    describe('initializeAuth', () => {
      it('should initialize auth from localStorage', () => {
        localStorage.setItem('token', 'test-token');
        localStorage.setItem('user', JSON.stringify({ id: 1, username: 'testuser', role: 'buyer' }));

        userStore.initializeAuth();

        expect(userStore.token).toBe('test-token');
        expect(userStore.user).toEqual({ id: 1, username: 'testuser', role: 'buyer' });
        expect(userStore.isAuthenticated).toBe(true);
      });

      it('should not initialize if no data in localStorage', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        userStore.initializeAuth();

        expect(userStore.token).toBeNull();
        expect(userStore.user).toBeNull();
        expect(userStore.isAuthenticated).toBe(false);
      });
    });
  });
});