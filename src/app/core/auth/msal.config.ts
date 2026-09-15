import {
  IPublicClientApplication,
  PublicClientApplication,
  InteractionType,
  BrowserCacheLocation,
  LogLevel,
  Configuration
} from '@azure/msal-browser';
import {
  MsalInterceptorConfiguration,
  MsalGuardConfiguration
} from '@azure/msal-angular';
import { environment } from '../../../environments/environment';

export function loggerCallback(logLevel: LogLevel, message: string): void {
  if (!environment.production) {
    // Solo loggear en desarrollo
    // console.log(`[MSAL] ${message}`);
  }
}

export function MSALInstanceFactory(): IPublicClientApplication {
  const msalConfig: Configuration = {
    auth: {
      clientId: environment.azure.clientId,
      authority: environment.azure.authority,
      redirectUri: typeof window !== 'undefined' ? window.location.origin + environment.azure.redirectUri : environment.azure.redirectUri,
      postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin + environment.azure.postLogoutRedirectUri : environment.azure.postLogoutRedirectUri,
      navigateToLoginRequestUrl: true
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
      storeAuthStateInCookie: false // Set to true if having issues on IE11 or Safari
    },
    system: {
      loggerOptions: {
        loggerCallback,
        logLevel: LogLevel.Warning,
        piiLoggingEnabled: false
      }
    }
  };

  return new PublicClientApplication(msalConfig);
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  // Map protected API endpoints to required Azure AD Scopes
  protectedResourceMap.set(environment.apiUrl + '/*', [environment.azure.apiScope]);
  protectedResourceMap.set('/api/*', [environment.azure.apiScope]);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: [environment.azure.apiScope]
    },
    loginFailedRoute: '/login'
  };
}
