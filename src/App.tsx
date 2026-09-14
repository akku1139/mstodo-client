import { useState, useEffect } from 'react';
import { PublicClientApplication, AccountInfo } from '@azure/msal-browser';
import { msalConfig, loginRequest } from './auth/msalConfig';
import { TodoApp } from './components/TodoApp';
import { Loader2 } from 'lucide-react';

// MSALインスタンスを初期化
const msalInstance = new PublicClientApplication(msalConfig);

function App() {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 初期化時に既存のアカウントを確認
    const initializeMsal = async () => {
      try {
        await msalInstance.initialize();
        
        // リダイレクト結果を処理
        const response = await msalInstance.handleRedirectPromise();
        if (response && response.account) {
          setAccount(response.account);
          setIsAuthenticated(true);
        } else {
          // キャッシュからアカウントを取得
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsAuthenticated(true);
          }
        }
      } catch (err) {
        console.error('MSAL初期化エラー:', err);
        setError('認証の初期化に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    initializeMsal();
  }, []);

  const handleLogin = async () => {
    setError(null);
    try {
      const response = await msalInstance.loginPopup({
        scopes: loginRequest.scopes,
      });
      
      if (response.account) {
        setAccount(response.account);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('ログインエラー:', err);
      setError('ログインに失敗しました。ポップアップがブロックされていないか確認してください。');
    }
  };

  const handleLogout = async () => {
    try {
      await msalInstance.logoutPopup();
      setAccount(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('ログアウトエラー:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.5 2.5h-9v9h9v-9zm10 0h-9v9h9v-9zm-10 10h-9v9h9v-9zm10 0h-9v9h9v-9z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Microsoft To Do</h1>
            <p className="text-gray-500 text-sm">
              Microsoftアカウントでサインインしてタスクを管理
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.5 2.5h-9v9h9v-9zm10 0h-9v9h9v-9zm-10 10h-9v9h9v-9zm10 0h-9v9h9v-9z"/>
            </svg>
            Microsoft でサインイン
          </button>

          <p className="text-xs text-gray-400 mt-4 text-center">
            Tasks.ReadWrite の権限のみを要求します
          </p>
        </div>
      </div>
    );
  }

  return <TodoApp account={account} msalInstance={msalInstance} onLogout={handleLogout} />;
}

export default App;
