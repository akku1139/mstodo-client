import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage } from '../i18n';
import { Settings, Globe, RefreshCw, LogOut, X } from 'lucide-react';
import { useState } from 'react';

interface SettingsPanelProps {
  userName: string;
  onRefresh: () => void;
  onLogout: () => void;
}

export function SettingsPanel({ userName, onRefresh, onLogout }: SettingsPanelProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ja'>(getCurrentLanguage());

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ja' : 'en';
    changeLanguage(newLang);
    setLanguage(newLang);
  };

  const handleRefresh = () => {
    onRefresh();
    setIsOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setIsOpen(false);
  };

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title={t('settings.title')}
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Settings Panel Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{t('settings.title')}</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* User Info */}
              <div className="pb-4 border-b border-gray-200">
                <p className="text-sm text-gray-500 mb-1">{t('settings.signedInAs')}</p>
                <p className="text-base font-medium text-gray-900">{userName}</p>
              </div>

              {/* Language Setting */}
              <div className="pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t('settings.language')}</p>
                      <p className="text-xs text-gray-500">
                        {language === 'en' ? 'English' : '日本語'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleLanguage}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {language === 'en' ? '日本語' : 'English'}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={handleRefresh}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium">{t('settings.refresh')}</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('settings.logout')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
