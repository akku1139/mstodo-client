import { Configuration, LogLevel } from '@azure/msal-browser';

// Microsoft Graph CLI のクライアントID（Microsoft公式）
// これにより、ユーザーが自分でAzure ADアプリを登録する必要がなくなります
// ※ このIDは個人用アカウント（consumers）では利用できないため、
//    組織用アカウント（organizations）での認証が必要です
export const MICROSOFT_TODO_CLIENT_ID = '14d82eec-204b-4c2f-b7e8-296a70dab67e';

export const getMsalConfig = (): Configuration => ({
  auth: {
    clientId: MICROSOFT_TODO_CLIENT_ID,
    authority: 'https://login.microsoftonline.com/organizations',
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
});

export const loginRequest = {
  scopes: [
    'Tasks.ReadWrite',
    'User.Read',
  ],
};

export const graphConfig = {
  graphEndpoint: 'https://graph.microsoft.com/v1.0',
  todoEndpoint: 'https://graph.microsoft.com/v1.0/me/todo',
};
