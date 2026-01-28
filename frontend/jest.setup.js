// jest.setup.js
import { config } from '@vue/test-utils';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock Vue Router
vi.mock('vue-router', async () => {
  const actual = await import('vue-router');
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      go: vi.fn(),
    }),
    useRoute: () => ({
      params: {},
      query: {},
    }),
  };
});

// Mock Pinia
vi.mock('pinia', async () => {
  const actual = await import('pinia');
  return {
    ...actual,
    useStore: vi.fn(),
    mapActions: vi.fn(),
  };
});

// Mock Element Plus components
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

// Configure Vue Test Utils
config.global.mocks = {
  $t: (msg) => msg, // Mock i18n if used
};

// Mock window.location
delete global.window.location;
global.window = Object.create(window);
global.window.location = {
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
};