import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequestPost } from './devicecode';

declare const global: any;

// fetchのモック
global.fetch = vi.fn();

describe('devicecode function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
      status: 200,
      json: async () => mockResponse,
    });

    const request = new Request('https://example.com/api/devicecode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: '14d82eec-204b-4c2f-b7e8-296a70dab67e',
        scope: 'Tasks.ReadWrite User.Read',
      }),
    });

    const context = {
      request,
      env: {},
      params: {},
      data: {},
      waitUntil: vi.fn(),
      next: vi.fn(),
    };

    const response = await onRequestPost(context as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://login.microsoftonline.com/common/oauth2/v2.0/devicecode',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('CORSヘッダーが正しく設定される', async () => {
    const mockResponse = {
      user_code: 'ABCD-1234',
      device_code: 'device-code-123',
      verification_uri: 'https://microsoft.com/devicelogin',
      expires_in: 900,
      interval: 5,
      message: 'To sign in',
    };

    (global.fetch as any).mockResolvedValueOnce({
      status: 200,
      json: async () => mockResponse,
    });

    const request = new Request('https://example.com/api/devicecode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: '14d82eec-204b-4c2f-b7e8-296a70dab67e',
        scope: 'Tasks.ReadWrite User.Read',
      }),
    });

    const context = {
      request,
      env: {},
      params: {},
      data: {},
      waitUntil: vi.fn(),
      next: vi.fn(),
    };

    const response = await onRequestPost(context as any);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
  });

  it('エラー時に500を返す', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const request = new Request('https://example.com/api/devicecode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: '14d82eec-204b-4c2f-b7e8-296a70dab67e',
        scope: 'Tasks.ReadWrite User.Read',
      }),
    });

    const context = {
      request,
      env: {},
      params: {},
      data: {},
      waitUntil: vi.fn(),
      next: vi.fn(),
    };

    const response = await onRequestPost(context as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
