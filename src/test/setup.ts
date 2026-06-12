import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

// Mock Tauri APIs
const mockInvoke = vi.fn();
const mockListen = vi.fn(() => Promise.resolve(() => {}));
const mockEmit = vi.fn();

// @ts-expect-error - mocking window.__TAURI_INTERNALS__
window.__TAURI_INTERNALS__ = {
  invoke: mockInvoke,
  transformCallback: () => {},
};

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: mockListen,
  emit: mockEmit,
}));

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn(() => ({
    hide: vi.fn().mockResolvedValue(undefined),
    show: vi.fn().mockResolvedValue(undefined),
    setFocus: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Reset mocks before each test
beforeEach(() => {
  mockInvoke.mockReset();
  mockListen.mockReset();
  mockEmit.mockReset();
});

// Export mocks for use in tests
export { mockInvoke, mockListen, mockEmit };
