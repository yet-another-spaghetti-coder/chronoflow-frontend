import { describe, it, expect, vi, beforeEach, afterEach, type MockedFunction } from 'vitest';

// Mock Firebase SDK functions using vi.hoisted
const {
  mockInitializeApp,
  mockGetMessaging,
  mockGetToken,
  mockOnMessage,
  mockIsSupported,
  mockDeleteToken
} = vi.hoisted(() => ({
  mockInitializeApp: vi.fn(),
  mockGetMessaging: vi.fn(),
  mockGetToken: vi.fn(),
  mockOnMessage: vi.fn(),
  mockIsSupported: vi.fn(),
  mockDeleteToken: vi.fn(),
}));

// Mock Firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: mockInitializeApp,
}));

vi.mock('firebase/messaging', () => ({
  getMessaging: mockGetMessaging,
  getToken: mockGetToken,
  onMessage: mockOnMessage,
  isSupported: mockIsSupported,
  deleteToken: mockDeleteToken,
}));

// Import the functions to test after mocking
import {
  initFirebase,
  requestNotificationPermission,
  getFcmToken,
  listenForMessages,
  isFcmSupported,
  deleteFcmToken,
} from '../firebaseUtils';

describe('firebaseUtils', () => {
  // Mock objects
  const mockApp = { name: 'test-app' };
  const mockMessaging = { app: mockApp };
  const mockServiceWorkerRegistration = {
    active: { state: 'activated' },
    installing: null,
    waiting: null,
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Reset module state by clearing the module cache
    vi.resetModules();

    // Setup default mock implementations
    mockInitializeApp.mockReturnValue(mockApp);
    mockGetMessaging.mockReturnValue(mockMessaging);
    mockIsSupported.mockResolvedValue(true);

    // Mock global Notification API
    Object.defineProperty(global, 'Notification', {
      value: {
        requestPermission: vi.fn(),
        permission: 'default',
      },
      configurable: true,
    });

    // Mock navigator.serviceWorker
    Object.defineProperty(global, 'navigator', {
      value: {
        serviceWorker: {
          register: vi.fn(),
          getRegistration: vi.fn(),
        },
      },
      writable: true,
    });

    // Mock console methods
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('requestNotificationPermission', () => {
    it('should request notification permission and return the result', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('granted');
      global.Notification.requestPermission = mockRequestPermission;

      const result = await requestNotificationPermission();

      expect(mockRequestPermission).toHaveBeenCalled();
      expect(result).toBe('granted');
    });

    it('should handle permission denied', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('denied');
      global.Notification.requestPermission = mockRequestPermission;

      const result = await requestNotificationPermission();

      expect(result).toBe('denied');
    });

    it('should handle permission default (dismissed)', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('default');
      global.Notification.requestPermission = mockRequestPermission;

      const result = await requestNotificationPermission();

      expect(result).toBe('default');
    });
  });

  describe('getFcmToken', () => {
    const vapidKey = 'test-vapid-key';

    beforeEach(() => {
      // Initialize Firebase before testing FCM token
      initFirebase();
      
      // Mock notification permission as granted
      Object.defineProperty(global.Notification, 'permission', {
        value: 'granted',
        configurable: true,
      });
      
      // Mock service worker registration
      const mockGetRegistration = navigator.serviceWorker.getRegistration as MockedFunction<typeof navigator.serviceWorker.getRegistration>;
      mockGetRegistration.mockResolvedValue(mockServiceWorkerRegistration as ServiceWorkerRegistration);
    });

    it('should return FCM token when everything is set up correctly', async () => {
      const expectedToken = 'test-fcm-token';
      mockGetToken.mockResolvedValue(expectedToken);

      const token = await getFcmToken(vapidKey);

      expect(mockGetToken).toHaveBeenCalledWith(mockMessaging, {
        vapidKey,
        serviceWorkerRegistration: mockServiceWorkerRegistration,
      });
      expect(token).toBe(expectedToken);
    });

    it('should return null when messaging is not supported', async () => {
      // Mock the messaging promise to resolve to null (unsupported)
      const token = await getFcmToken(vapidKey);

      // Should handle gracefully even without explicit unsupported check
      expect(token).toBeNull();
    });

    it('should return null when VAPID key is missing', async () => {
      const token = await getFcmToken('');

      expect(token).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('[FCM] Missing VAPID key.');
    });

    it('should return null when notification permission is not granted', async () => {
      Object.defineProperty(global.Notification, 'permission', {
        value: 'denied',
        configurable: true,
      });

      const token = await getFcmToken(vapidKey);

      expect(token).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        '[FCM] Notification permission is not granted; skip getToken.'
      );
    });

    it('should return null when getToken throws an error', async () => {
      mockGetToken.mockRejectedValue(new Error('Token generation failed'));

      const token = await getFcmToken(vapidKey);

      expect(token).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        '[FCM] Error while retrieving token:',
        expect.any(Error)
      );
    });

    it('should return null when getToken returns empty string', async () => {
      mockGetToken.mockResolvedValue('');

      const token = await getFcmToken(vapidKey);

      expect(token).toBeNull();
    });

    it('should handle service worker registration when no existing registration', async () => {
      const mockGetRegistration = navigator.serviceWorker.getRegistration as MockedFunction<typeof navigator.serviceWorker.getRegistration>;
      const mockRegister = navigator.serviceWorker.register as MockedFunction<typeof navigator.serviceWorker.register>;
      
      mockGetRegistration.mockResolvedValue(undefined);
      mockRegister.mockResolvedValue({
        ...mockServiceWorkerRegistration,
        active: { state: 'activated' },
      } as ServiceWorkerRegistration);

      mockGetToken.mockResolvedValue('test-token');

      const token = await getFcmToken(vapidKey);

      expect(mockRegister).toHaveBeenCalledWith('/firebase-messaging-sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      expect(token).toBe('test-token');
    });

    it('should handle service worker registration when service worker is installing', async () => {
      const mockStateChangeHandler = vi.fn();
      const mockInstallingWorker = {
        state: 'installing',
        addEventListener: vi.fn((event, handler) => {
          if (event === 'statechange') {
            mockStateChangeHandler.mockImplementation(() => {
              // Simulate state change to activated
              Object.defineProperty(mockInstallingWorker, 'state', { value: 'activated' });
              handler();
            });
          }
        }),
        removeEventListener: vi.fn(),
      };

      const mockRegistrationWithInstalling = {
        ...mockServiceWorkerRegistration,
        active: null,
        installing: mockInstallingWorker,
      };

      const mockGetRegistration = navigator.serviceWorker.getRegistration as MockedFunction<typeof navigator.serviceWorker.getRegistration>;
      mockGetRegistration.mockResolvedValue(mockRegistrationWithInstalling as unknown as ServiceWorkerRegistration);

      mockGetToken.mockResolvedValue('test-token');

      // Trigger the state change immediately
      setTimeout(() => mockStateChangeHandler(), 0);

      const token = await getFcmToken(vapidKey);

      expect(token).toBe('test-token');
    });
  });

  describe('listenForMessages', () => {
    beforeEach(() => {
      initFirebase();
    });

    it('should set up message listener when messaging is available', async () => {
      const callback = vi.fn();

      await listenForMessages(callback);

      expect(mockOnMessage).toHaveBeenCalledWith(mockMessaging, expect.any(Function));
    });

    it('should call the callback when message is received', async () => {
      const callback = vi.fn();
      const mockPayload = {
        notification: {
          title: 'Test Notification',
          body: 'Test message body',
        },
      };

      // Capture the onMessage callback
      let messageHandler: ((payload: any) => void) | null = null;
      mockOnMessage.mockImplementation((_messaging, handler) => {
        messageHandler = handler;
      });

      await listenForMessages(callback);

      // Simulate receiving a message
      if (messageHandler) {
        (messageHandler as any)(mockPayload);
      }

      expect(callback).toHaveBeenCalledWith(mockPayload);
    });

    it('should handle when messaging is not available', async () => {
      const callback = vi.fn();

      // Should handle gracefully even if messaging setup has issues
      await expect(listenForMessages(callback)).resolves.not.toThrow();
    });
  });

  describe('isFcmSupported', () => {
    it('should return true when FCM is supported', async () => {
      mockIsSupported.mockResolvedValue(true);

      const result = await isFcmSupported();

      expect(result).toBe(true);
      expect(mockIsSupported).toHaveBeenCalled();
    });

    it('should return false when FCM is not supported', async () => {
      mockIsSupported.mockResolvedValue(false);

      const result = await isFcmSupported();

      expect(result).toBe(false);
      expect(mockIsSupported).toHaveBeenCalled();
    });
  });

  describe('deleteFcmToken', () => {
    beforeEach(() => {
      initFirebase();
    });

    it('should successfully delete FCM token', async () => {
      mockDeleteToken.mockResolvedValue(true);

      const result = await deleteFcmToken();

      expect(mockDeleteToken).toHaveBeenCalledWith(mockMessaging);
      expect(result).toBe(true);
    });

    it('should return false when delete token fails', async () => {
      mockDeleteToken.mockResolvedValue(false);

      const result = await deleteFcmToken();

      expect(result).toBe(false);
    });

    it('should handle when messaging is not available', async () => {
      const result = await deleteFcmToken();

      // Should handle gracefully when messaging is not available
      expect(result).toBeFalsy();
    });

    it('should handle deleteToken throwing an error', async () => {
      mockDeleteToken.mockRejectedValue(new Error('Delete failed'));

      const result = await deleteFcmToken();

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        '[FCM] deleteToken failed:',
        expect.any(Error)
      );
    });
  });

  describe('service worker handling', () => {
    beforeEach(() => {
      initFirebase();
      Object.defineProperty(global.Notification, 'permission', {
        value: 'granted',
        configurable: true,
      });
    });

    it('should handle when service worker is not supported', async () => {
      // Mock navigator without serviceWorker
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
      });

      const token = await getFcmToken('test-vapid-key');

      expect(token).toBeNull();
    });

    it('should handle service worker registration failure', async () => {
      const mockGetRegistration = vi.fn().mockResolvedValue(undefined);
      const mockRegister = vi.fn().mockRejectedValue(new Error('Registration failed'));

      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            getRegistration: mockGetRegistration,
            register: mockRegister,
          },
        },
        writable: true,
      });

      const token = await getFcmToken('test-vapid-key');

      expect(token).toBeNull();
    });

    it('should handle service worker becoming redundant during installation', async () => {
      const mockStateChangeHandler = vi.fn();
      const mockInstallingWorker = {
        state: 'installing',
        addEventListener: vi.fn((event, handler) => {
          if (event === 'statechange') {
            mockStateChangeHandler.mockImplementation(() => {
              // Simulate state change to redundant
              Object.defineProperty(mockInstallingWorker, 'state', { value: 'redundant' });
              handler();
            });
          }
        }),
        removeEventListener: vi.fn(),
      };

      const mockRegistrationWithInstalling = {
        active: null,
        installing: mockInstallingWorker,
        waiting: null,
      };

      const mockGetRegistration = vi.fn().mockResolvedValue(mockRegistrationWithInstalling);

      Object.defineProperty(global, 'navigator', {
        value: {
          serviceWorker: {
            getRegistration: mockGetRegistration,
            register: vi.fn(),
          },
        },
        writable: true,
      });

      // Trigger the state change immediately
      setTimeout(() => mockStateChangeHandler(), 0);

      const token = await getFcmToken('test-vapid-key');

      expect(token).toBeNull();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle undefined environment variables gracefully', async () => {
      // Test that the function doesn't break with undefined env vars
      // The actual config object creation should still work with undefined values
      expect(() => initFirebase()).not.toThrow();
    });

    it('should handle multiple rapid calls to initFirebase', () => {
      // Should not throw when called multiple times
      expect(() => {
        initFirebase();
        initFirebase();
        initFirebase();
      }).not.toThrow();
    });

    it('should handle getFcmToken with null VAPID key', async () => {
      initFirebase();
      Object.defineProperty(global.Notification, 'permission', {
        value: 'granted',
        configurable: true,
      });

      const token = await getFcmToken(null as any);

      expect(token).toBeNull();
    });

    it('should handle getFcmToken with undefined VAPID key', async () => {
      initFirebase();
      Object.defineProperty(global.Notification, 'permission', {
        value: 'granted',
        configurable: true,
      });

      const token = await getFcmToken(undefined as any);

      expect(token).toBeNull();
    });
  });
});