import { LogLevel, Configuration, AuthenticationResult, EventType, PublicClientApplication, SilentRequest } from '@azure/msal-browser';
import { getSecretFromKeyVault } from './keyvault';

function parseClientInfo() {
    let keyVaultURL: string = import.meta.env.VITE_AZURE_KEYVAULT_ENDPOINT;
    let entraClientId: string = import.meta.env.VITE_ENTRA_CLIENT_ID;
    let entraTenantId: string = import.meta.env.VITE_ENTRA_TENANT_ID;

    getSecretFromKeyVault(keyVaultURL, entraClientId)
        .then((value) => entraClientId = <string>value)
        .catch((e) => console.log(`Error retrieving secret: ${e.message}`));

    getSecretFromKeyVault(keyVaultURL, entraTenantId)
        .then((value) => entraTenantId = <string>value)
        .catch((e) => console.log(`Error retrieving secret: ${e.message}`));

    let clientId: string = (window as any).CLIENT_ID;
    let tenantId: string = (window as any).TENANT_ID;
    if (clientId.startsWith('{{')) clientId = entraClientId;
    if (tenantId.startsWith('{{')) tenantId = entraTenantId;
    return { clientId, tenantId };
}
const { clientId, tenantId } = parseClientInfo();

console.log({ tenantId, clientId });

export const msalConfig: Configuration = {
    auth: {
        clientId: clientId, // This is the ONLY mandatory field that you need to supply.
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
                        // console.info(message);
                        return;
                    case LogLevel.Verbose:
                        // console.debug(message);
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

export async function acquireTokens(forceRefresh = false): Promise<AuthenticationResult> {
    await msalInstance.initialize();
    const activeAccount = msalInstance.getActiveAccount(); // This will only return a non-null value if you have logic somewhere else that calls the setActiveAccount API
    const accounts = msalInstance.getAllAccounts();

    if (!activeAccount && accounts.length === 0) {
        throw new Error('No accounts found');
    }
    const request: SilentRequest = {
        scopes: appScopes,
        account: activeAccount || accounts[0],
        forceRefresh,
    };

    const authResult = await msalInstance.acquireTokenSilent(request);
    const exp = (authResult.idTokenClaims as any).exp;
    const now = Math.floor(Date.now() / 1000) + 300; // 5 minutes from now
    if (exp < now) {
        return await acquireTokens(true);
    }


    return authResult;
};


export const handleLogin = (popup = false) => {
    if (popup) msalInstance.loginPopup({ scopes: appScopes, redirectUri: "/auth" }).catch((error) => console.log(error));
    else msalInstance.loginRedirect({ scopes: appScopes, redirectUri: "/auth" }).catch((error) => console.log(error));
};

export const handleLogout = (popup = false) => {
    if (popup) msalInstance.logoutPopup({ mainWindowRedirectUri: '/', account: msalInstance.getActiveAccount(), }).catch((error) => console.log(error));
    else msalInstance.logoutRedirect().catch((error) => console.log(error));
};
