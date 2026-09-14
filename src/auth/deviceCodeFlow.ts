/**
 * デバイスコードフローの実装（CORSプロキシ経由）
 * Microsoft Graph CLIのクライアントIDを使用して、
 * ブラウザからMicrosoftアカウントで認証します
 */

const CLIENT_ID = '14d82eec-204b-4c2f-b7e8-296a70dab67e'; // Microsoft Graph CLI
const AUTHORITY = 'https://login.microsoftonline.com/common';
const SCOPES = 'Tasks.ReadWrite User.Read';
const TOKEN_CACHE_KEY = 'ms_todo_token_cache';

export interface DeviceCodeResponse {
  user_code: string;
  device_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
  message: string;
}

export interface TokenResponse {
  token_type: string;
  scope: string;
  expires_in: number;
  ext_expires_in: number;
  access_token: string;
  refresh_token: string;
  id_token: string;
}

export interface AccountInfo {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  idToken: string;
}

/**
 * デバイスコードフローを開始
 */
export async function startDeviceCodeFlow(): Promise<DeviceCodeResponse> {
  const response = await fetch('/api/devicecode', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      scope: SCOPES,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to start device code flow');
  }

  return response.json();
}

/**
 * トークンをポーリング
 */
export async function pollForToken(
  deviceCode: string,
  interval: number,
  expiresIn: number,
  onStatusChange?: (status: string) => void
): Promise<TokenResponse> {
  const startTime = Date.now();
  const timeout = expiresIn * 1000;

  while (Date.now() - startTime < timeout) {
    await new Promise(resolve => setTimeout(resolve, interval * 1000));

    const response = await fetch('/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: deviceCode,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return data;
    }

    if (data.error === 'authorization_pending') {
      onStatusChange?.('authorization_pending');
      continue;
    }

    if (data.error === 'slow_down') {
      interval += 5;
      onStatusChange?.('slow_down');
      continue;
    }

    if (data.error === 'expired_token') {
      throw new Error('Device code expired. Please try again.');
    }

    if (data.error === 'authorization_declined') {
      throw new Error('User declined authorization.');
    }

    throw new Error(data.error_description || 'Failed to get token');
  }

  throw new Error('Timeout waiting for authorization');
}

/**
 * リフレッシュトークンを使用してアクセストークンを更新
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch('/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: SCOPES,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Failed to refresh token');
  }

  return response.json();
}

/**
 * アカウント情報をキャッシュに保存
 */
export function saveAccountInfo(account: AccountInfo): void {
  localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(account));
}

/**
 * キャッシュからアカウント情報を取得
 */
export function getAccountInfo(): AccountInfo | null {
  const cached = localStorage.getItem(TOKEN_CACHE_KEY);
  if (!cached) return null;

  try {
    const account: AccountInfo = JSON.parse(cached);
    return account;
  } catch {
    return null;
  }
}

/**
 * キャッシュをクリア
 */
export function clearAccountInfo(): void {
  localStorage.removeItem(TOKEN_CACHE_KEY);
}

/**
 * 有効なアクセストークンを取得（キャッシュまたは更新）
 */
export async function getValidAccessToken(): Promise<string | null> {
  const account = getAccountInfo();
  if (!account) return null;

  // トークンがまだ有効かチェック（5分の余裕を持たせる）
  const now = Date.now();
  const bufferTime = 5 * 60 * 1000; // 5分

  if (account.expiresAt > now + bufferTime) {
    return account.accessToken;
  }

  // トークンを更新
  try {
    const tokenResponse = await refreshAccessToken(account.refreshToken);
    const newAccount: AccountInfo = {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: now + tokenResponse.expires_in * 1000,
      idToken: tokenResponse.id_token,
    };
    saveAccountInfo(newAccount);
    return newAccount.accessToken;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    clearAccountInfo();
    return null;
  }
}
