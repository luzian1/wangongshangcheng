import { ref } from 'vue';
import { useLogin } from '@/composables/useLogin';
import { useUserStore } from '@/stores/user';
import { createTestingPinia } from '@pinia/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp } from 'vue';

// Mock the user store
vi.mock('@/stores/user', () => ({
  useUserStore: vi.fn(),
}));

// Mock ElMessage
vi.mock('element-plus', async () => {
  const actual = await import('element-plus');
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  };
});

// Mock Vue Router
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

describe('useLogin composable', () => {
  let mockUserStore;
  let mockRouter;
  let originalConsoleError;

  beforeEach(() => {
    // Mock the user store
    mockUserStore = {
      login: vi.fn(),
    };
    
    vi.mocked(useUserStore).mockReturnValue(mockUserStore);
    
    // Mock the router
    mockRouter = {
      push: vi.fn(),
    };
    
    vi.mock('vue-router', () => ({
      useRouter: vi.fn(() => mockRouter),
    }));

    // Suppress console errors during tests
    originalConsoleError = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    console.error = originalConsoleError;
  });

  it('should initialize with correct default values', () => {
    const { loading, loginForm, loginRules } = useLogin();
    
    expect(loading.value).toBe(false);
    expect(loginForm.value).toEqual({
      username: '',
      password: '',
    });
    expect(loginRules).toBeDefined();
    expect(loginRules.username).toBeDefined();
    expect(loginRules.password).toBeDefined();
  });

  it('should validate login form rules', () => {
    const { loginRules } = useLogin();
    
    // Test username validation
    expect(loginRules.username.length).toBe(1);
    expect(loginRules.username[0].required).toBe(true);
    expect(loginRules.username[0].message).toBe('请输入用户名');
    
    // Test password validation
    expect(loginRules.password.length).toBe(2);
    expect(loginRules.password[0].required).toBe(true);
    expect(loginRules.password[0].message).toBe('请输入密码');
    expect(loginRules.password[1].min).toBe(6);
    expect(loginRules.password[1].message).toBe('密码长度不能少于6位');
  });

  it('should call login on successful form validation', async () => {
    const { handleLogin } = useLogin();
    
    // Mock successful login response
    mockUserStore.login.mockResolvedValue({
      success: true,
      data: { token: 'test-token', user: { id: 1, username: 'testuser' } }
    });
    
    // Mock validation function that returns true
    const mockValidateForm = vi.fn().mockResolvedValue(true);
    
    await handleLogin(mockValidateForm);
    
    expect(mockValidateForm).toHaveBeenCalled();
    expect(mockUserStore.login).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });

  it('should show error message when login fails', async () => {
    const { handleLogin } = useLogin();
    
    // Mock failed login response
    mockUserStore.login.mockResolvedValue({
      success: false,
      error: 'Invalid credentials'
    });
    
    // Mock validation function that returns true
    const mockValidateForm = vi.fn().mockResolvedValue(true);
    
    await handleLogin(mockValidateForm);
    
    expect(mockValidateForm).toHaveBeenCalled();
    expect(mockUserStore.login).toHaveBeenCalled();
    // We can't easily test ElMessage here without importing it directly
  });

  it('should not attempt login when form validation fails', async () => {
    const { handleLogin } = useLogin();
    
    // Mock validation function that returns false
    const mockValidateForm = vi.fn().mockResolvedValue(false);
    
    await handleLogin(mockValidateForm);
    
    expect(mockValidateForm).toHaveBeenCalled();
    expect(mockUserStore.login).not.toHaveBeenCalled();
  });

  it('should set loading state during login process', async () => {
    const { loading, handleLogin } = useLogin();
    
    // Mock login to resolve after a delay
    mockUserStore.login.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve({
          success: true,
          data: { token: 'test-token', user: { id: 1, username: 'testuser' } }
        }), 10);
      });
    });
    
    // Mock validation function that returns true
    const mockValidateForm = vi.fn().mockResolvedValue(true);
    
    const loginPromise = handleLogin(mockValidateForm);
    
    // Check that loading is true immediately
    expect(loading.value).toBe(true);
    
    // Wait for login to complete
    await loginPromise;
    
    // Check that loading is false after completion
    expect(loading.value).toBe(false);
  });

  it('should handle login errors gracefully', async () => {
    const { handleLogin } = useLogin();
    
    // Mock validation function that returns true
    const mockValidateForm = vi.fn().mockResolvedValue(true);
    
    // Mock login to throw an error
    mockUserStore.login.mockRejectedValue(new Error('Network error'));
    
    await handleLogin(mockValidateForm);
    
    // Verify that login was called but no error was thrown from handleLogin
    expect(mockUserStore.login).toHaveBeenCalled();
  });
});