import { Configuration, LogLevel } from '@azure/msal-browser';

// Microsoft Teams Web のクライアントID（SPAとして登録済み）
export const MS_CLIENT_ID = '5e3ce6c0-2b1f-4285-8d4b-75ee78787346';

export const msalConfig: Configuration = {
  auth: {
    clientId: MS_CLIENT_ID,
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string) => {
        if (level === LogLevel.Error) {
          console.error(message);
        }
      },
      logLevel: LogLevel.Warning,
    },
  },
};

export const loginRequest = {
  scopes: ['Tasks.ReadWrite', 'User.Read'],
};
