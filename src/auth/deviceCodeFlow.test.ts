import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  startDeviceCodeFlow,
  pollForToken,
  refreshAccessToken,
  saveAccountInfo,
  getAccountInfo,
  clearAccountInfo,
  getValidAccessToken,
} from './deviceCodeFlow';

declare const global: any;

// fetchのモック
global.fetch = vi.fn();

describe('deviceCodeFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('startDeviceCodeFlow', () => {
    it('デバイスコードを正常に取得できる', async () => {
      const mockResponse = {
        user_code: 'ABCD-1234',
        device_code: 'device-code-123',
        verification_uri: 'https://microsoft.com/devicelogin',
        expires_in: 900,
        interval: 5,
        message: 'To sign in, use a web browser to open the page https://microsoft.com/devicelogin',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await startDeviceCodeFlow();

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith('/api/devicecode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: '14d82eec-204b-4c2f-b7e8-296a70dab67e',
          scope: 'Tasks.ReadWrite User.Read',
        }),
      });
    });

    it('エラー時に例外をスローする', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error_description: 'Invalid client' }),
      });

      await expect(startDeviceCodeFlow()).rejects.toThrow('Invalid client');
    });
  });

  describe('pollForToken', () => {
    it('認証完了後にトークンを取得できる', async () => {
      const mockTokenResponse = {
        token_type: 'Bearer',
        scope: 'Tasks.ReadWrite User.Read',
        expires_in: 3600,
        ext_expires_in: 3600,
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        id_token: 'id-token-123',
      };

      // 最初はauthorization_pending、2回目で成功
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'authorization_pending' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse,
        });

      const result = await pollForToken('device-code-123', 0.01, 900);

      expect(result).toEqual(mockTokenResponse);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('slow_down時に間隔を延ばす', async () => {
      const mockTokenResponse = {
        token_type: 'Bearer',
        scope: 'Tasks.ReadWrite User.Read',
        expires_in: 3600,
        ext_expires_in: 3600,
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        id_token: 'id-token-123',
      };

      // setTimeoutをモックして即座に解決
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = ((fn: () => void) => {
        fn();
        return 0 as any;
      }) as any;

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'slow_down' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse,
        });

      try {
        const result = await pollForToken('device-code-123', 0.01, 900);
        expect(result).toEqual(mockTokenResponse);
      } finally {
        global.setTimeout = originalSetTimeout;
      }
    });

    it('expired_token時に例外をスローする', async () => {
      // setTimeoutをモックして即座に解決
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = ((fn: () => void) => {
        fn();
        return 0 as any;
      }) as any;

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'expired_token' }),
      });

      try {
        await expect(pollForToken('device-code-123', 0.01, 900)).rejects.toThrow(
          'Device code expired. Please try again.'
        );
      } finally {
        global.setTimeout = originalSetTimeout;
      }
    });

    it('authorization_declined時に例外をスローする', async () => {
      // setTimeoutをモックして即座に解決
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = ((fn: () => void) => {
        fn();
        return 0 as any;
      }) as any;

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'authorization_declined' }),
      });

      try {
        await expect(pollForToken('device-code-123', 0.01, 900)).rejects.toThrow(
          'User declined authorization.'
        );
      } finally {
        global.setTimeout = originalSetTimeout;
      }
    });
  });

  describe('refreshAccessToken', () => {
    it('リフレッシュトークンで新しいアクセストークンを取得できる', async () => {
      const mockTokenResponse = {
        token_type: 'Bearer',
        scope: 'Tasks.ReadWrite User.Read',
        expires_in: 3600,
        ext_expires_in: 3600,
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        id_token: 'new-id-token',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      const result = await refreshAccessToken('old-refresh-token');

      expect(result).toEqual(mockTokenResponse);
      expect(global.fetch).toHaveBeenCalledWith('/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: '14d82eec-204b-4c2f-b7e8-296a70dab67e',
          grant_type: 'refresh_token',
          refresh_token: 'old-refresh-token',
          scope: 'Tasks.ReadWrite User.Read',
        }),
      });
    });

    it('エラー時に例外をスローする', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error_description: 'Invalid refresh token' }),
      });

      await expect(refreshAccessToken('invalid-token')).rejects.toThrow(
        'Invalid refresh token'
      );
    });
  });

  describe('Account Info Cache', () => {
    it('アカウント情報を保存・取得できる', () => {
      const accountInfo = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
        idToken: 'id-token',
      };

      saveAccountInfo(accountInfo);
      const retrieved = getAccountInfo();

      expect(retrieved).toEqual(accountInfo);
    });

    it('キャッシュをクリアできる', () => {
      const accountInfo = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
        idToken: 'id-token',
      };

      saveAccountInfo(accountInfo);
      clearAccountInfo();
      const retrieved = getAccountInfo();

      expect(retrieved).toBeNull();
    });

    it('無効なJSONの場合はnullを返す', () => {
      localStorage.setItem('ms_todo_token_cache', 'invalid-json');
      const retrieved = getAccountInfo();

      expect(retrieved).toBeNull();
    });
  });

  describe('getValidAccessToken', () => {
    it('有効なトークンがある場合はそれを返す', async () => {
      const accountInfo = {
        accessToken: 'valid-access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000, // 1時間後
        idToken: 'id-token',
      };

      saveAccountInfo(accountInfo);
      const result = await getValidAccessToken();

      expect(result.status).toBe('valid');
      if (result.status === 'valid') {
        expect(result.accessToken).toBe('valid-access-token');
      }
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('トークンが期限切れの場合は更新する', async () => {
      const accountInfo = {
        accessToken: 'expired-access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() - 1000, // 既に期限切れ
        idToken: 'id-token',
      };

      saveAccountInfo(accountInfo);

      const newTokenResponse = {
        token_type: 'Bearer',
        scope: 'Tasks.ReadWrite User.Read',
        expires_in: 3600,
        ext_expires_in: 3600,
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        id_token: 'new-id-token',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => newTokenResponse,
      });

      const result = await getValidAccessToken();

      expect(result.status).toBe('refreshed');
      if (result.status === 'refreshed') {
        expect(result.accessToken).toBe('new-access-token');
      }
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // キャッシュが更新されていることを確認
      const updatedAccount = getAccountInfo();
      expect(updatedAccount?.accessToken).toBe('new-access-token');
    });

    it('アカウント情報がない場合はno_accountを返す', async () => {
      const result = await getValidAccessToken();

      expect(result.status).toBe('no_account');
    });

    it('トークン更新に失敗した場合はexpiredを返す', async () => {
      const accountInfo = {
        accessToken: 'expired-access-token',
        refreshToken: 'invalid-refresh-token',
        expiresAt: Date.now() - 1000,
        idToken: 'id-token',
      };

      saveAccountInfo(accountInfo);

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error_description: 'Invalid refresh token' }),
      });

      const result = await getValidAccessToken();

      expect(result.status).toBe('expired');
      // キャッシュはクリアされない（再ログインを促すため）
      expect(getAccountInfo()).not.toBeNull();
    });
  });
});
