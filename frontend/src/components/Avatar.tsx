import { useEffect, useState } from "react";
import { acquireTokens } from "../api/msal";

interface AvatarProps {
    userId?: string;
    userName?: string;
    staticPath?: string;
    staticText?: string;
    size?:number;
}

export const Avatar = ({ userId, userName, staticPath, staticText, size }: AvatarProps) => {
    const [imageData, setImageData] = useState<string | null>(null);

    const sizeClass = size ? `h-${size} w-${size}` : 'h-12 w-12';

    useEffect(() => {
        async function fetchImage() {
            if (!userId) {
                if(staticPath) {
                    setImageData(staticPath);
                }
                return;
            }
            const accessToken = (await acquireTokens()).accessToken;
            const res = await fetch(`https://graph.microsoft.com/v1.0/users/${userId}/photo/$value`, {
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
    }, [userId, staticPath]);

    const text = userName || staticText || '';
    const displayText = text
        ? text.split(' ').filter((_, id) => id < 2).map(x => x[0]).join('')
        : '';

    return (
        <div className={`${sizeClass} border border-1 border-neutral-200 flex-grow-0 flex-shrink-0 rounded-full bg-white m-2 overflow-hidden flex items-center justify-center`}
        title={text}>
            {imageData
                ? <img src={imageData} className={sizeClass} alt="" />
                : <div className="text-2xl">
                    {displayText}
                </div>}
        </div>
    );
};