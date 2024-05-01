import { useEffect, useState } from "react";
import { getAppVersion } from "../api/internal";


declare const SERVER_VERSION: string;
declare const FRONTEND_VERSION: string;

export const Footer = () => {
    const [webapp, setWebapp] = useState<string>('');
    const [fnapp, setFnapp] = useState<string>('');
    useEffect(() => {
        getAppVersion().then((v) => {
            setWebapp(v.webapp);
            setFnapp(v.fnapp);
        });
    }, []);
    return <>
        <div className=" h-6 bg-slate-700 text-white overflow-hidden text-sm px-6 items-center flex">
            <span className="pr-2 flex-0">
                App version:
            </span>
            <span title="Web server" className="flex-0 cursor-help rounded-full px-1 bg-slate-300 text-slate-700 text-xs">
                {webapp}</span>
            <span className="px-1">/</span>
            <span title="Frontend" className="flex-0 cursor-help rounded-full px-1 bg-slate-300 text-slate-700 text-xs">
                {FRONTEND_VERSION}</span>
            <span className="px-1">/</span>
            <span title="Batch processor" className="flex-0 cursor-help rounded-full px-1 bg-slate-300 text-slate-700 text-xs">
                {fnapp}</span>
        </div>
    </>
};