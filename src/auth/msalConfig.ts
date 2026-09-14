import { Configuration, LogLevel } from '@azure/msal-browser';

// Microsoft Graph CLI のクライアントID
export const MS_CLIENT_ID = '14d82eec-204b-4c2f-b7e8-296a70dab67e';

export const msalConfig: Configuration = {
  auth: {
    clientId: MS_CLIENT_ID,
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: 'https://login.microsoftonline.com/common/oauth2/nativeclient',
    postLogoutRedirectUri: 'https://login.microsoftonline.com/common/oauth2/nativeclient',
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
