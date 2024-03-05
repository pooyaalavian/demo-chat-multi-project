import { useParams } from 'react-router-dom';
import { BaseSyntheticEvent, useEffect, useRef, useState } from "react";
import { BackToTopic } from '../topics/BackToTopic';
import { fetchThread, sendThreadChat } from '../../api/internal';
import { ChatMessage } from './chat-message';
import { Thread } from '../../types/thread';
import { SendIcon } from '@fluentui/react-icons-mdl2';


export const SingleThread = () => {
    const { topicId, threadId } = useParams();
    const [thread, setThread] = useState<Thread | null>(null);
    const [thinking, setThinking] = useState(false);
    const chatPanel = useRef<HTMLDivElement>(null);

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

        const message = event.target.querySelector('#message').innerText;
        setThinking(true);
        event.target.querySelector('#message').innerText = '';
        const res = await sendThreadChat(topicId, threadId, message);
        setThread(res);
        setThinking(false);
    };

    if (!thread) return (<div>Loading...</div>);

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

                {thread.messages && thread.messages.map((m, id) => <ChatMessage key={id} message={m} />)}
                {thinking && <div>Thinking...</div>}
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
                </div>
            </div>
        </div>
    </>
};