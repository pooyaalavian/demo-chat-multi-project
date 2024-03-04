import { LogLevel, Configuration, AuthenticationResult, EventType, PublicClientApplication } from '@azure/msal-browser';

const tenantId: string = import.meta.env.VITE_ENTRA_TENANT_ID;
const clientId: string = import.meta.env.VITE_ENTRA_CLIENT_ID;

console.log({ tenantId, clientId });

export const msalConfig: Configuration = {
    auth: {
        clientId: import.meta.env.VITE_ENTRA_CLIENT_ID, // This is the ONLY mandatory field that you need to supply.
        authority: `https://login.microsoftonline.com/${tenantId}`, // Defaults to "https://login.microsoftonline.com/common"
        redirectUri: '/auth', // You must register this URI on Azure Portal/App Registration. Defaults to window.location.origin
        postLogoutRedirectUri: '/', // Indicates the page to navigate after logout.
        clientCapabilities: ['CP1'], // this lets the resource owner know that this client is capable of handling claims challenge.
    },
    cache: {
        cacheLocation: 'localStorage', // Configures cache location. "sessionStorage" is more secure, but "localStorage" gives you SSO between tabs.
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Info:
                        console.info(message);
                        return;
                    case LogLevel.Verbose:
                        console.debug(message);
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                }
            },
        },
    },
};

export const appScopes = ['User.Read', 'profile'];

export const msalInstance = new PublicClientApplication(msalConfig);

// Account selection logic is app dependent. Adjust as needed for different use cases.
if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
    msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
}


msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload && (event.payload as AuthenticationResult).account) {
        const account = (event.payload as AuthenticationResult).account;
        msalInstance.setActiveAccount(account);
    }

    if (event.eventType === EventType.LOGOUT_SUCCESS) {
        if (msalInstance.getAllAccounts().length > 0) {
            msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
        }
    }

    if (event.eventType === EventType.LOGIN_FAILURE) {
        console.log(JSON.stringify(event));
    }
});

export const acquireTokens = async () => {
    const activeAccount = msalInstance.getActiveAccount(); // This will only return a non-null value if you have logic somewhere else that calls the setActiveAccount API
    const accounts = msalInstance.getAllAccounts();

    if (!activeAccount && accounts.length === 0) {
        throw new Error('No accounts found');
    }
    const request = {
        scopes: appScopes,
        account: activeAccount || accounts[0]
    };

    const authResult = await msalInstance.acquireTokenSilent(request);

    return authResult;
};
