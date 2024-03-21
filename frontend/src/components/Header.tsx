import { AccountInfo } from "@azure/msal-browser";
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { handleLogin, handleLogout } from "../api/msal";
import { Avatar } from "./Avatar";


let title = (window as any).TITLE || '';
const tmp = document.createElement("div");
tmp.innerHTML = title;
title = tmp.textContent || title;

const Menu = ({ account }: { account: AccountInfo }) => {
    const roles = account?.idTokenClaims?.roles || ['User'];
    return <>
        <div className="fixed top-0 left-0 right-0 bottom-0"></div>
        <div className="fixed top-0 right-0 mt-16 min-w-64 rounded-sm shadow-lg bg-white text-blue-950 border border-gray-200"
            style={{ zIndex: 9999 }}>
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
        </div>
    </>;
};

const LoggedInPanel = ({ account }: { account: AccountInfo }) => {
    const [menuVisible, setMenuVisible] = useState(false);


    const toggleMenu = () => setMenuVisible(!menuVisible);

    return <div className="cursor-pointer" onClick={toggleMenu}>
        <div className="flex flex-row  hover:bg-blue-200 hover:text-blue-900 transition-all duration-500">
            <div className="w-2"></div>
            <div className="col1 max-w-48">
                <div className="flex flex-col h-full justify-center">
                    <div className="row1 text-xl overflow-hidden">{account.name}</div>
                    {/* <div className="row2 text-sm overflow-hidden text-ellipsis">{account.username}</div> */}
                </div>
            </div>
            <Avatar userId={account.localAccountId} userName={account.name} />
            {/* <div className="col2 flex-grow-0 flex-shrink-0 h-12 w-12 rounded-full bg-white m-2 overflow-hidden flex items-center justify-center">
                {imageData
                    ? <img src={imageData} className="w-12 h-12" alt="" />
                    : <div className="text-2xl">
                        {account.name?.split(' ').filter((_, id) => id < 2).map(x => x[0]).join('')}
                    </div>}
            </div> */}
        </div>
        {menuVisible && <Menu account={account} />}
    </div>;
};

const LoggedOutPanel = () => {
    return <div className="w-20 h-12 flex items-center justify-center">
        <button onClick={() => handleLogin()}
            className="border border-gray-700 hover:bg-blue-700 hover:text-white hover:shadow-md bg-white rounded-md p-2 text-blue-900">
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


    return <section id="header" className="flex flex-row h-16 overflow-hidden items-center bg-blue-950 text-blue-100">
        <div className="flex-grow-0 flex-shrink-0 px-2 text-3xl flex items-center">
         {title}
        </div>
        <Link className="p-1 underline cursor-pointer transition-all hover:bg-white hover:text-blue-600 items-center flex" to="/">Home</Link>
        <Link className="p-1 underline cursor-pointer transition-all hover:bg-white hover:text-blue-600 items-center flex" to="/topics">Topics</Link>
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

