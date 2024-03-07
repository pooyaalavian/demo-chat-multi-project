import { useParams } from 'react-router-dom';
import { BaseSyntheticEvent, useEffect, useRef, useState } from "react";
import { BackToTopic } from '../topics/BackToTopic';
import { fetchThread, sendThreadChat } from '../../api/internal';
import { ChatMessage } from './chat-message';
import { Thread } from '../../types/thread';
import { SendIcon } from '@fluentui/react-icons-mdl2';
import { useAccount } from '@azure/msal-react';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { LoadingBar } from '../../components/LoadingBar';


const EmptyArea = () => {
    return <div className="flex flex-col items-center justify-center h-full text-gray-300">
        <div className="text-3xl">Start typing below</div>
    </div>
}

export const SingleThread = () => {
    const { topicId, threadId } = useParams();
    const [thread, setThread] = useState<Thread | null>(null);
    const [thinking, setThinking] = useState(false);
    const chatPanel = useRef<HTMLDivElement>(null);
    const account = useAccount();

    useEffect(() => {
        if (topicId && threadId) {
            console.log('fetching thread');
            fetchThread(topicId, threadId).then((data) => {
                setThread(data);
                console.log(data);
                if (chatPanel.current) {
                    chatPanel.current.scrollIntoView({ behavior: "smooth" });
                }
            });
        }
    }, [topicId, threadId]);

    const sendChat = async (event: BaseSyntheticEvent) => {
        event.preventDefault();
        console.log(event);
        if (!topicId) return console.error('No topicId');
        if (!threadId) return console.error('No threadId');
        if (!thread) return console.error('No thread');

        const message = event.target.querySelector('#message').innerText;
        setThinking(true);
        event.target.querySelector('#message').innerText = '';
        setThread({
            ...thread,
            messages: [
                ...thread.messages,
                { role: 'user', agent: 'human',
                 userId: account?.localAccountId||'', 
                 name: `${account?.idTokenClaims?.given_name} ${account?.idTokenClaims?.family_name}`||'Me', 
                 content: message,
                 timestamp: new Date().toISOString(),
                },
            ]
        });
        const res = await sendThreadChat(topicId, threadId, message);
        setThread(res);
        setThinking(false);
    };

    const prompt_tokens = thread?.usage?.map(u => u.prompt_tokens).reduce((a, b) => a + b, 0);
    const completion_tokens = thread?.usage?.map(u => u.completion_tokens).reduce((a, b) => a + b, 0);

    if (!thread) return (<LoadingSpinner/>);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            let target = event.target as HTMLElement;
            while (target.tagName !== 'FORM') {
                target = target.parentElement as HTMLElement;
            }
            event.target = target;
            sendChat(event as unknown as BaseSyntheticEvent);
        }
    }

    return <>
        <BackToTopic topicId={topicId} />
        <div className="flex flex-col  flex-auto">
            <div className="flex-none h-16">
                <h1>Thread: {thread ? thread.name : '...'}</h1>
            </div>
            <div className="flex-grow overflow-y-auto overflow-x-hidden">
                {(!thread.messages || thread.messages.length == 0) && <EmptyArea />}
                {thread.messages && thread.messages.map((m, id) => <ChatMessage key={id} message={m} />)}
                {thinking && <LoadingBar/>}
            </div>
            <div className="flex-none " ref={chatPanel}>
                <div className="bg-blue-50 py-4 -m-2 px-2">
                    <div className="flex flex-row items-stretch">
                        <form onSubmit={sendChat} className='w-full flex items-end'>
                            <div className="flex-1">
                                {/* <input id="message" type="text" className="border  rounded-md border-gray-800 p-3 w-full" placeholder="Chat message" /> */}
                                <span role="textbox" id="message"
                                    className="w-full inline-block bg-white border rounded-md min-h-12 p-2"
                                    contentEditable
                                    onKeyDown={(e) => handleKeyDown(e)}
                                ></span>
                            </div>
                            <div className="flex-0 item-bottom">
                                <button
                                    className="btn border ml-2 border-blue-600 text-blue-600 rounded-full w-8 h-8 item-center hover:text-white hover:bg-blue-600">
                                    <div className="h-0.5"></div>
                                    <div className="flex items-center justify-center h-full w-full">
                                        <div className="w-1"></div>
                                        <SendIcon />
                                    </div>
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="flex flex-row">
                        <div className="flex-1"></div>
                        <div className="flex-0">
                            <div className="text-sm text-gray-500">
                                Usage so far: {prompt_tokens || 0} prompt tokens + {completion_tokens || 0} response tokens
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
};