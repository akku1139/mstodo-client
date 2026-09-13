import { useState } from 'react';
import { Key, Info, ExternalLink } from 'lucide-react';

interface SetupPageProps {
  onSetup: (clientId: string) => void;
}

export function SetupPage({ onSetup }: SetupPageProps) {
  const [clientId, setClientId] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientId.trim()) {
      onSetup(clientId.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <Key className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Microsoft To Do 連携</h1>
            <p className="text-sm text-gray-500">Azure ADアプリの認証設定</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 text-sm leading-relaxed">
            Microsoft To Doと連携するには、Azure ADにアプリを登録してクライアントIDを取得する必要があります。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              クライアントID (Application ID)
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!clientId.trim()}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            認証して開始
          </button>
        </form>

        <button
          onClick={() => setShowHelp(!showHelp)}
          className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <Info className="w-4 h-4" />
          クライアントIDの取得方法
        </button>

        {showHelp && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">1.</span>
                <span>
                  <a
                    href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Azure Portal
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  にサインイン
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">2.</span>
                <span>「アプリの登録」→「新しい登録」をクリック</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">3.</span>
                <span>名前を入力し、リダイレクトURIに「シングルページアプリケーション」を選択</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">4.</span>
                <span>リダイレクトURI: <code className="bg-gray-200 px-1 rounded">{window.location.origin}</code></span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">5.</span>
                <span>「認証」→「暗黙的な許可とハイブリッドフロー」で「アクセストークン」を有効化</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">6.</span>
                <span>「APIのアクセス許可」→「Microsoft Graph」→「委任されたアクセス許可」で「Tasks.ReadWrite」を追加</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">7.</span>
                <span>「概要」ページの「アプリケーション (クライアント) ID」をコピー</span>
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
