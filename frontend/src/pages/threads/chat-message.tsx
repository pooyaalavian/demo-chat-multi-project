import { useState } from "react";
import { AiAssistantMessage, AnyMessage, HumanMessage, SearchUserMessage } from "../../types/thread";


interface ChatMessageProps<T> {
    message: T;
}

export const ChatMessage = ({ message }: ChatMessageProps<AnyMessage>) => {
    return <div className="mx-1 my-2">
        {message.role === 'user' && message.agent === 'human' && <UserMessage message={message} />}
        {message.role === 'user' && message.agent === 'search-assistant' && <SearchMessage message={message} />}
        {message.role === 'assistant' && <AssistantMessage message={message} />}
    </div>;
}

export const UserMessage = ({ message }: ChatMessageProps<HumanMessage>) => {
    return <div className="flex">
        <div className="flex-gorw-0 flex-shrink-0 w-16">&nbsp;</div>
        <div className="flex-1 bg-gray-100 rounded-lg p-3">
            <div className="header">{message.name}:</div>
            <div className="content">
                {message.content}
            </div>
        </div>
        <div className="flex-gorw-0 flex-shrink-0 w-4">&nbsp;</div>
    </div>;
};

export const SearchMessage = ({ message }: ChatMessageProps<SearchUserMessage>) => {
    const [expanded, setExpanded] = useState(false);

    const toggleExpanded = () => {
        setExpanded(!expanded);
    };
    return <div className="flex">
        <div className="flex-gorw-0 flex-shrink-0 w-4">&nbsp;</div>
        <div className="flex-1 bg-orange-100 rounded-lg p-3">
            <div className="header">Search provider:
                <button className="btn" onClick={toggleExpanded}>({expanded ? 'Close results' : 'Expand results'})</button>
            </div>
            <div className="inputs">
                <div>Type: {message.search_type}</div>
                <div>Input: {message.input}</div>
            </div>
            {expanded && <div className="content">
                <div className="results">
                    <div>Results:</div>
                    <div>
                        {message.results.map((r, i) => <div key={i}>
                            <div className="text-xl">
                                Result {i + 1}:
                            </div>
                            <div className="text-sm">
                                {r.content}
                            </div>
                        </div>)}
                    </div>
                </div>
            </div>}
        </div>
        <div className="flex-gorw-0 flex-shrink-0 w-16">&nbsp;</div>
    </div>;
};

export const AssistantMessage = ({ message }: ChatMessageProps<AiAssistantMessage>) => {
    return <div className="flex">
        <div className="flex-gorw-0 flex-shrink-0 w-4">&nbsp;</div>
        <div className="flex-1 bg-blue-200 rounded-lg p-3">
            <div className="header">GPT-4:</div>
            <div className="content">
                {message.content}
            </div>
        </div>
        <div className="flex-gorw-0 flex-shrink-0 w-16">&nbsp;</div>
    </div>;
};