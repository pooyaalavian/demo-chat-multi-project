import { AccountInfo } from "@azure/msal-browser";
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal, useAccount } from "@azure/msal-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { appScopes } from "./api/msal";



export const Header = () => {
    const { instance, accounts, inProgress } = useMsal();
    const [apiData, setApiData] = useState<unknown>(null);
    let account: AccountInfo | null = null;
    if (instance) {
        account = instance.getActiveAccount();
    }

    useEffect(() => {
        if (account) {
            instance.acquireTokenSilent({
                scopes: ["User.Read"],
                account: account
            }).then((response) => {
                console.log({ token: response.idToken });
            });
        }
    }, [account, instance]);


    const handleLoginPopup = () => {
        /**
         * When using popup and silent APIs, we recommend setting the redirectUri to a blank page or a page 
         * that does not implement MSAL. Keep in mind that all redirect routes must be registered with the application
         * For more information, please follow this link: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/login-user.md#redirecturi-considerations 
         */
        instance.loginPopup({
            scopes: appScopes,
            redirectUri: "/auth"
        }).catch((error) => console.log(error));
    };

    const handleLoginRedirect = () => {
        instance.loginRedirect({ scopes: appScopes, redirectUri: '/auth' }).catch((error) => console.log(error));
    };

    const handleLogoutPopup = () => {
        instance
            .logoutPopup({
                mainWindowRedirectUri: '/', // redirects the top level app after logout
                account: instance.getActiveAccount(),
            })
            .catch((error) => console.log(error));
    };

    const handleLogoutRedirect = () => {
        instance.logoutRedirect().catch((error) => console.log(error));
    };
    return <>
        <div className="h1 text-2xl p-2">
            <Link to="/">Pooya's Demo Chat</Link>
        </div>
        <AuthenticatedTemplate>
            <div className="">
                <button onClick={handleLogoutPopup}>
                    Sign out using Popup
                </button>
                <button onClick={handleLogoutRedirect}>
                    Sign out using Redirect
                </button>
            </div>
        </AuthenticatedTemplate>
        <UnauthenticatedTemplate>
            <div className="">
                <button onClick={handleLoginPopup}>
                    Sign in using Popup
                </button>
                <button onClick={handleLoginRedirect}>
                    Sign in using Redirect
                </button>
            </div>
        </UnauthenticatedTemplate>
        {account && <pre>{JSON.stringify(account, null, 2)}</pre>}
    </>
};

