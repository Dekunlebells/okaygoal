import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Setup globals for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock WebSocket
global.WebSocket = class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  
  CONNECTING = 0;
  OPEN = 1;
  CLOSING = 2;
  CLOSED = 3;
  
  readyState = this.CONNECTING;
  url = '';
  
  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      this.readyState = this.OPEN;
      this.onopen?.(new Event('open'));
    }, 0);
  }
  
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  
  send(data: string) {
    // Mock send
  }
  
  close() {
    this.readyState = this.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }
  
  addEventListener() {}
  removeEventListener() {}
} as any;

// Mock Notification API
global.Notification = class MockNotification {
  static permission: NotificationPermission = 'default';
  
  static requestPermission(): Promise<NotificationPermission> {
    return Promise.resolve('granted');
  }
  
  constructor(title: string, options?: NotificationOptions) {
    // Mock constructor
  }
  
  close() {}
} as any;

// Mock ServiceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn(() => Promise.resolve({
      showNotification: jest.fn(),
      pushManager: {
        getSubscription: jest.fn(() => Promise.resolve(null)),
        subscribe: jest.fn(() => Promise.resolve({}))
      }
    })),
    addEventListener: jest.fn()
  },
  writable: true
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Setup fetch mock
global.fetch = jest.fn();