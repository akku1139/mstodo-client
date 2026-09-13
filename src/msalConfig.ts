import { Configuration, LogLevel } from '@azure/msal-browser';

export const getMsalConfig = (clientId: string): Configuration => ({
  auth: {
    clientId,
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
