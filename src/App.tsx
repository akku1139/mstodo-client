import { useState, useEffect } from 'react';
import { MsalProvider, useMsal, useIsAuthenticated } from '@azure/msal-react';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { getMsalConfig, loginRequest } from './msalConfig';
import { SetupPage } from './components/SetupPage';
import { TodoApp } from './components/TodoApp';
import { Loader2 } from 'lucide-react';

const CLIENT_ID_STORAGE_KEY = 'ms_todo_client_id';

function AuthenticatedApp() {
  const isAuthenticated = useIsAuthenticated();
  const { instance } = useMsal();
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async () => {
    setLoggingIn(true);
    try {
      await instance.loginPopup(loginRequest);
    } catch (error) {
      console.error('Login failed:', error);
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Microsoft アカウントでログイン</h2>
          <p className="text-gray-500 text-sm mb-6">
            Microsoft To Doのタスクを管理するために、Microsoftアカウントで認証してください。
          </p>
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
        </div>
      </div>
    );
  }

  return <TodoApp />;
}

function App() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const savedClientId = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (savedClientId) {
      setClientId(savedClientId);
    } else {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (clientId) {
      const config = getMsalConfig(clientId);
      const instance = new PublicClientApplication(config);

      // Handle redirect promise
      instance.initialize().then(() => {
        instance.handleRedirectPromise().then((result) => {
          if (result) {
            // Handle login result
          }
          setMsalInstance(instance);
          setInitializing(false);
        }).catch(() => {
          setMsalInstance(instance);
          setInitializing(false);
        });

        // Listen for login events
        instance.addEventCallback((event) => {
          if (event.eventType === EventType.LOGIN_SUCCESS) {
            // Login successful
          }
        });
      });
    }
  }, [clientId]);

  const handleSetup = (newClientId: string) => {
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, newClientId);
    setClientId(newClientId);
    setInitializing(true);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">初期化中...</p>
        </div>
      </div>
    );
  }

  if (!clientId || !msalInstance) {
    return <SetupPage onSetup={handleSetup} />;
  }

  return (
    <MsalProvider instance={msalInstance}>
      <AuthenticatedApp />
    </MsalProvider>
  );
}

export default App;
