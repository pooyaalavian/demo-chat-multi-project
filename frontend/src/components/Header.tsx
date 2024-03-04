import { AccountInfo } from "@azure/msal-browser";
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { acquireTokens, handleLogin, handleLogout } from "../api/msal";


const Menu = ({ account }: { account: AccountInfo }) => {
    const roles = account?.idTokenClaims?.roles || ['User'];
    return <div className="fixed top-0 right-0 mt-16 min-w-64 rounded-sm shadow-lg bg-white text-blue-950 border border-gray-200">
        <div className="flex flex-col">
            <div className="flex-1 m-2">You are logged in as<br></br>
                <span className="italic"> {account.username}</span>
            </div>
            <div className="flex-1 m-2">You have the following roles:
                <ul>
                    {roles.map((role, id) => <li key={id} className="italic">{role}</li>)}
                </ul>
            </div>
            <div className="flex-1 bg-gray-100 p-2">
                <button onClick={() => handleLogout(true)}
                    className="border border-gray-700 hover:bg-blue-700 hover:text-white hover:shadow-md bg-white rounded-md p-2">
                    Sign out
                </button>
            </div>
        </div>
    </div>;
};

const LoggedInPanel = ({ account }: { account: AccountInfo }) => {
    const [imageData, setImageData] = useState<string | null>(null);
    const [menuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        async function fetchImage() {
            if (!account) return;
            const accessToken = (await acquireTokens()).accessToken;
            const res = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'image/jpeg',
                }
            });
            if (res.status > 299) {
                setImageData(null);
                return console.error(res.statusText);
            }
            const blob = await res.blob();
            const reader = new FileReader();
            reader.onload = () => {
                setImageData(reader.result as string);
            };
            reader.readAsDataURL(blob);
        };
        fetchImage().catch(console.error);
    }, [account]);

    const toggleMenu = () => setMenuVisible(!menuVisible);

    return <div className="cursor-pointer" onClick={toggleMenu}>
        <div className="flex flex-row">
            <div className="col1 max-w-48 ">
                <div className="flex flex-col h-full justify-center">
                    <div className="row1 text-xl overflow-hidden">{account.name}</div>
                    {/* <div className="row2 text-sm overflow-hidden text-ellipsis">{account.username}</div> */}
                </div>
            </div>
            <div className="col2 flex-grow-0 flex-shrink-0 h-12 w-12 rounded-full bg-white m-2 overflow-hidden flex items-center justify-center">
                {imageData
                    ? <img src={imageData} className="w-12 h-12" alt="" />
                    : <div className="text-2xl">
                        {account.name?.split(' ').filter((_, id) => id < 2).map(x => x[0]).join('')}
                    </div>}
            </div>
        </div>
        {menuVisible && <Menu account={account} />}
    </div>;
};

const LoggedOutPanel = () => {
    return <div className="w-20 h-12 flex items-center justify-center">
        <button onClick={() => handleLogin(true)}
            className="border border-gray-700 hover:bg-blue-700 hover:text-white hover:shadow-md bg-white rounded-md p-2">
            Sign in
        </button>
    </div>;
}

export const Header = () => {
    const { instance, } = useMsal();
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

    return <section id="header" className="flex flex-row h-16 overflow-hidden items-center bg-blue-950 text-blue-100">
        <div className="h1 text-2xl p-2 flex-grow-0 flex-shrink-0">
            <Link to="/">Pooya's Demo Chat</Link>
        </div>
        <div className="flex-1"></div>
        <div className="flex-0">
            <AuthenticatedTemplate>
                <LoggedInPanel account={account!} />
            </AuthenticatedTemplate>
            <UnauthenticatedTemplate>
                <LoggedOutPanel />
            </UnauthenticatedTemplate>
        </div>
    </section>
};

