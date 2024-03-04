import { useParams } from 'react-router-dom';
import { BaseSyntheticEvent, useEffect, useState } from "react";
import { BackToTopic } from '../topics/BackToTopic';
import { fetchThread, sendThreadChat } from '../../api/internal';
import { ChatMessage } from './chat-message';
import { Thread } from '../../types/thread';

export const SingleThread = () => {
    const { topicId, threadId } = useParams();
    const [thread, setThread] = useState<Thread | null>(null);
    const [thinking, setThinking] = useState(false);
    
    useEffect(() => {
        if (topicId && threadId)
            fetchThread(topicId, threadId).then((data) => setThread(data));
    }, [topicId, threadId]);

    const sendChat = async (event: BaseSyntheticEvent) => {
        event.preventDefault();
        console.log(event);
        if (!topicId) return console.error('No topicId');
        if (!threadId) return console.error('No threadId');

        const message = event.target.querySelector('#message').value;
        setThinking(true);
        const res = await sendThreadChat(topicId, threadId, message);
        setThread(res);
        setThinking(false);
        event.target.querySelector('#message').value = '';
    };

    if (!thread) return (<div>Loading...</div>);

    return <>
        <BackToTopic topicId={topicId} />
        <div className="flex flex-col h-full flex-auto">
            <div className="flex-0 h-16">
                <h1>Thread: {thread ? thread.name : '...'}</h1>
            </div>
            <div className="flex-auto h-full">

                {thread.messages && thread.messages.map((m, id) => <ChatMessage key={id} message={m} />)}
                {thinking && <div>Thinking...</div>}
            </div>
            <div className="flex-0">
                <div className="border rounded-lg p-2 border-gray-800">

                    <div className="flex flex-row items-stretch">
                        <form onSubmit={sendChat} className='w-full flex'>
                            <div className="flex-1">
                                <input id="message" type="text" className="border  rounded-md border-gray-800 p-3 w-full" placeholder="Chat message" />
                            </div>
                            <div className="flex-0">
                                <button
                                    className="btn border h-full p-2 ml-2 border-blue-600 rounded-md">
                                    Send
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </>
};