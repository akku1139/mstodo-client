import { Configuration, LogLevel } from '@azure/msal-browser';

// Microsoft To Do 公式アプリのクライアントID
// これにより、ユーザーが自分でAzure ADアプリを登録する必要がなくなります
export const MICROSOFT_TODO_CLIENT_ID = '871c010f-5e61-4fb1-83ac-98610a6e236f';

export const getMsalConfig = (): Configuration => ({
  auth: {
    clientId: MICROSOFT_TODO_CLIENT_ID,
    authority: 'https://login.microsoftonline.com/consumers',
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
