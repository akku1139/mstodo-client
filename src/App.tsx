import { useState, useEffect } from 'react';
import { MsalProvider, useMsal, useIsAuthenticated } from '@azure/msal-react';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { getMsalConfig, loginRequest } from './msalConfig';
import { TodoApp } from './components/TodoApp';
import { Loader2 } from 'lucide-react';

const msalInstance = new PublicClientApplication(getMsalConfig());

function AuthenticatedApp() {
  const isAuthenticated = useIsAuthenticated();
  const { instance } = useMsal();
  const [loggingIn, setLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoggingIn(true);
    setErrorMessage(null);
    try {
      await instance.loginPopup({
        scopes: loginRequest.scopes,
      });
    } catch (error) {
      console.error('Login failed:', error);
      setErrorMessage('認証に失敗しました。ポップアップがブロックされていないか確認してください。');
    } finally {
      setLoggingIn(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.5 2.5h-9v9h9v-9zm10 0h-9v9h9v-9zm-10 10h-9v9h9v-9zm10 0h-9v9h9v-9z"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Microsoft To Do</h2>
          <p className="text-gray-500 text-sm mb-6">
            Microsoftアカウントでサインインして、タスクを管理しましょう
          </p>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loggingIn}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loggingIn ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                認証中...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.5 2.5h-9v9h9v-9zm10 0h-9v9h9v-9zm-10 10h-9v9h9v-9zm10 0h-9v9h9v-9z"/>
                </svg>
                Microsoft でサインイン
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 mt-4">
            サインインすると、Microsoft To Doのタスクにアクセスします
          </p>
        </div>
      </div>
    );
  }

  return <TodoApp />;
}

function App() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // MSAL初期化
    msalInstance.initialize().then(() => {
      // リダイレクト結果を処理
      msalInstance.handleRedirectPromise().then((result) => {
        if (result) {
          console.log('Redirect login successful');
        }
        setInitialized(true);
      }).catch(() => {
        setInitialized(true);
      });

      // イベントリスナー
      msalInstance.addEventCallback((event) => {
        if (event.eventType === EventType.LOGIN_SUCCESS) {
          console.log('Login successful');
        }
      });
    });
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">初期化中...</p>
        </div>
      </div>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      <AuthenticatedApp />
    </MsalProvider>
  );
}

export default App;
