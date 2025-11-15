import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';
import type { User, AuthCredentials } from '@/lib/auth-type';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.getState().clear();
  });

  describe('Initial State', () => {
    it('should have null user as initial state', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });

    it('should provide setAuth and clear methods', () => {
      const state = useAuthStore.getState();
      expect(typeof state.setAuth).toBe('function');
      expect(typeof state.clear).toBe('function');
    });
  });

  describe('setAuth', () => {
    it('should set user when valid credentials are provided', () => {
      const mockUser: User = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'organizer'
      };

      const credentials: AuthCredentials = { user: mockUser };

      useAuthStore.getState().setAuth(credentials);
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
    });

    it('should update user when setAuth is called multiple times', () => {
      const firstUser: User = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'organizer'
      };

      const secondUser: User = {
        id: '456',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'member'
      };

      // Set first user
      useAuthStore.getState().setAuth({ user: firstUser });
      expect(useAuthStore.getState().user).toEqual(firstUser);

      // Update to second user
      useAuthStore.getState().setAuth({ user: secondUser });
      expect(useAuthStore.getState().user).toEqual(secondUser);
    });

    it('should preserve user object properties correctly', () => {
      const mockUser: User = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@company.com',
        role: 'admin'
      };

      useAuthStore.getState().setAuth({ user: mockUser });
      
      const storedUser = useAuthStore.getState().user;
      expect(storedUser).not.toBeNull();
      expect(storedUser!.id).toBe('user-123');
      expect(storedUser!.name).toBe('Test User');
      expect(storedUser!.email).toBe('test@company.com');
      expect(storedUser!.role).toBe('admin');
    });

    it('should handle different user roles correctly', () => {
      const roles = ['organizer', 'member', 'admin', 'viewer'];

      roles.forEach(role => {
        const user: User = {
          id: `${role}-id`,
          name: `${role} User`,
          email: `${role}@test.com`,
          role
        };

        useAuthStore.getState().setAuth({ user });
        expect(useAuthStore.getState().user?.role).toBe(role);
      });
    });

    it('should handle users with special characters in properties', () => {
      const userWithSpecialChars: User = {
        id: 'user-123-456',
        name: "O'Connor, John Jr.",
        email: 'john.o-connor+test@example.co.uk',
        role: 'organizer'
      };

      useAuthStore.getState().setAuth({ user: userWithSpecialChars });
      
      const storedUser = useAuthStore.getState().user;
      expect(storedUser?.name).toBe("O'Connor, John Jr.");
      expect(storedUser?.email).toBe('john.o-connor+test@example.co.uk');
    });
  });

  describe('clear', () => {
    it('should clear user state when called', () => {
      // First set a user
      const mockUser: User = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'organizer'
      };

      useAuthStore.getState().setAuth({ user: mockUser });
      expect(useAuthStore.getState().user).toEqual(mockUser);

      // Then clear
      useAuthStore.getState().clear();
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('should be safe to call clear when user is already null', () => {
      // Ensure user is null
      expect(useAuthStore.getState().user).toBeNull();

      // Clear again - should not throw
      expect(() => useAuthStore.getState().clear()).not.toThrow();
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('should clear user completely without leaving any traces', () => {
      const mockUser: User = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'organizer'
      };

      useAuthStore.getState().setAuth({ user: mockUser });
      useAuthStore.getState().clear();
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.user).not.toEqual(mockUser);
    });
  });

  describe('Store Persistence', () => {
    it('should maintain state consistency across multiple operations', () => {
      const user1: User = {
        id: '1',
        name: 'User 1',
        email: 'user1@test.com',
        role: 'member'
      };

      const user2: User = {
        id: '2',
        name: 'User 2',
        email: 'user2@test.com',
        role: 'organizer'
      };

      // Set user 1
      useAuthStore.getState().setAuth({ user: user1 });
      expect(useAuthStore.getState().user).toEqual(user1);

      // Set user 2
      useAuthStore.getState().setAuth({ user: user2 });
      expect(useAuthStore.getState().user).toEqual(user2);

      // Clear
      useAuthStore.getState().clear();
      expect(useAuthStore.getState().user).toBeNull();

      // Set user 1 again
      useAuthStore.getState().setAuth({ user: user1 });
      expect(useAuthStore.getState().user).toEqual(user1);
    });
  });

  describe('Type Safety', () => {
    it('should maintain proper type structure for User object', () => {
      const mockUser: User = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'organizer'
      };

      useAuthStore.getState().setAuth({ user: mockUser });
      
      const storedUser = useAuthStore.getState().user;
      
      // Type assertions to ensure proper typing
      expect(typeof storedUser?.id).toBe('string');
      expect(typeof storedUser?.name).toBe('string');
      expect(typeof storedUser?.email).toBe('string');
      expect(typeof storedUser?.role).toBe('string');
    });

    it('should handle AuthCredentials interface correctly', () => {
      const mockUser: User = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'organizer'
      };

      const credentials: AuthCredentials = { user: mockUser };

      // Should not throw type errors
      expect(() => useAuthStore.getState().setAuth(credentials)).not.toThrow();
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string values in user properties', () => {
      const userWithEmptyStrings: User = {
        id: '',
        name: '',
        email: '',
        role: ''
      };

      useAuthStore.getState().setAuth({ user: userWithEmptyStrings });
      
      const storedUser = useAuthStore.getState().user;
      expect(storedUser?.id).toBe('');
      expect(storedUser?.name).toBe('');
      expect(storedUser?.email).toBe('');
      expect(storedUser?.role).toBe('');
    });

    it('should handle very long string values', () => {
      const longString = 'a'.repeat(1000);
      const userWithLongValues: User = {
        id: longString,
        name: longString,
        email: `${longString}@example.com`,
        role: longString
      };

      useAuthStore.getState().setAuth({ user: userWithLongValues });
      
      const storedUser = useAuthStore.getState().user;
      expect(storedUser?.id).toBe(longString);
      expect(storedUser?.name).toBe(longString);
      expect(storedUser?.role).toBe(longString);
    });

    it('should handle Unicode characters in user properties', () => {
      const userWithUnicode: User = {
        id: 'user-测试-🚀',
        name: 'José María Azaña',
        email: 'josé@München.de',
        role: 'administrador'
      };

      useAuthStore.getState().setAuth({ user: userWithUnicode });
      
      const storedUser = useAuthStore.getState().user;
      expect(storedUser?.id).toBe('user-测试-🚀');
      expect(storedUser?.name).toBe('José María Azaña');
      expect(storedUser?.email).toBe('josé@München.de');
      expect(storedUser?.role).toBe('administrador');
    });
  });

  describe('Store Isolation', () => {
    it('should maintain singleton behavior across state references', () => {
      // Get initial state references
      const state1 = useAuthStore.getState();
      const state2 = useAuthStore.getState();

      // They should be the same reference (Zustand singleton)
      expect(state1).toBe(state2);

      const mockUser: User = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'organizer'
      };

      // Set auth through one reference
      useAuthStore.getState().setAuth({ user: mockUser });

      // Both references should see the same change since it's a singleton
      expect(useAuthStore.getState().user).toEqual(mockUser);
      
      // Clear through one reference  
      useAuthStore.getState().clear();
      
      // Both should see the cleared state
      expect(useAuthStore.getState().user).toBeNull();
    });
  });
});