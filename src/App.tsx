import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  startDeviceCodeFlow,
  pollForToken,
  getValidAccessToken,
  saveAccountInfo,
  clearAccountInfo,
  type DeviceCodeResponse,
} from './auth/deviceCodeFlow';
import { TodoApp } from './components/TodoApp';
import { Loader2, CheckCircle, ExternalLink, Copy } from 'lucide-react';
import './i18n';

type AuthState = 'loading' | 'unauthenticated' | 'authenticating' | 'authenticated';

function App() {
  const { t } = useTranslation();
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [deviceCode, setDeviceCode] = useState<DeviceCodeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const result = await getValidAccessToken();
    if (result.status === 'valid' || result.status === 'refreshed') {
      setAuthState('authenticated');
    } else {
      setAuthState('unauthenticated');
    }
  };

  const handleLogin = async () => {
    setAuthState('authenticating');
    setError(null);
    setDeviceCode(null);

    try {
      const dcResponse = await startDeviceCodeFlow();
      setDeviceCode(dcResponse);

      const tokenResponse = await pollForToken(
        dcResponse.device_code,
        dcResponse.interval,
        dcResponse.expires_in
      );

      const now = Date.now();
      saveAccountInfo({
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: now + tokenResponse.expires_in * 1000,
        idToken: tokenResponse.id_token,
      });

      setAuthState('authenticated');
    } catch (err) {
      setError(err instanceof Error ? err.message : '認証に失敗しました');
      setAuthState('unauthenticated');
    }
  };

  const handleLogout = () => {
    clearAccountInfo();
    setAuthState('unauthenticated');
    setDeviceCode(null);
  };

  // 定期的にトークンの状態をチェック
  useEffect(() => {
    if (authState !== 'authenticated') return;

    const checkTokenStatus = async () => {
      const result = await getValidAccessToken();
      if (result.status === 'expired' || result.status === 'no_account') {
        setAuthState('unauthenticated');
        setError(t('auth.sessionExpired'));
      }
    };

    // 5分ごとにトークンの状態をチェック
    const interval = setInterval(checkTokenStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [authState, t]);

  const handleCopyCode = () => {
    if (deviceCode) {
      navigator.clipboard.writeText(deviceCode.user_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('app.loading')}</p>
        </div>
      </div>
    );
  }

  if (authState === 'authenticated') {
    return <TodoApp onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.5 2.5h-9v9h9v-9zm10 0h-9v9h9v-9zm-10 10h-9v9h9v-9zm10 0h-9v9h9v-9z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('app.title')}</h1>
          <p className="text-gray-500 text-sm">
            {t('auth.signInSubtitle')}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {authState === 'authenticating' && deviceCode && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-medium text-blue-900">
                  {t('deviceCode.enterCode')}
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 mb-3 border border-blue-100">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-mono font-bold text-blue-700 tracking-wider">
                    {deviceCode.user_code}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Copy code"
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">1.</span>
                  <a
                    href={deviceCode.verification_uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    {t('deviceCode.step1', { url: deviceCode.verification_uri })}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>{t('deviceCode.step2')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>{t('deviceCode.step3')}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('deviceCode.waiting')}</span>
              </div>

              <p className="text-xs text-blue-500 mt-3 text-center">
                {t('deviceCode.expiresIn', { minutes: Math.round(deviceCode.expires_in / 60) })}
              </p>
            </div>
          </div>
        )}

        {authState === 'unauthenticated' && (
          <button
            onClick={handleLogin}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.5 2.5h-9v9h9v-9zm10 0h-9v9h9v-9zm-10 10h-9v9h9v-9zm10 0h-9v9h9v-9z"/>
            </svg>
            {t('auth.signIn')}
          </button>
        )}

        {authState === 'authenticating' && !deviceCode && (
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t('deviceCode.fetchingCode')}</span>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4 text-center">
          {t('auth.authAs')}
          <br />
          {t('auth.permissions')}
        </p>
      </div>
    </div>
  );
}

export default App;
