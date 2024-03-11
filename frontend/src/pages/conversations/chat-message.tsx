import { useEffect, useState } from "react";
import { AiAssistantMessage, AnyMessage, HumanMessage, SearchUserMessage } from "../../types/conversation";
import Markdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import { Avatar } from "../../components/Avatar";
import { useAccount } from "@azure/msal-react";

interface ChatMessageProps<T> {
    message: T;
}

export const ChatMessage = ({ message }: ChatMessageProps<AnyMessage>) => {
    return <div className="mx-1 my-2">
        {message.role === 'user' && message.agent === 'human' && <UserMessage message={message} />}
        {/* {message.role === 'user' && message.agent === 'search-assistant' && <SearchMessage message={message} />} */}
        {message.role === 'assistant' && <AssistantMessage message={message} />}
    </div>;
}

export const UserMessage = ({ message }: ChatMessageProps<HumanMessage>) => {
    const account = useAccount();
    const isMe = (account && message.userId === account.localAccountId);
    const bgColor = isMe ? 'bg-blue-100' : 'bg-gray-100';

    return <div className="flex">
        <div className="flex-gorw-0 flex-shrink-0 w-24">&nbsp;</div>
        <div className="flex-1 relative">
            <div className="header absolute -right-6">
                <Avatar userId={message.userId} userName={message.name} size={8} />
            </div>
            <div className={"flex-1 rounded-lg p-2 pr-4 border-gray-300 border " + bgColor}>
                <div className="date text-xs text-gray-700 flex flex-row">
                    <div className="flex-0">
                        Sent {new Date(message.timestamp).toLocaleString()}
                    </div>
                </div>
                <div className="content min-h-8">
                    <Markdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                    </Markdown>
                </div>
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
        <div className="flex-1 relative">
            <div className="header absolute -left-6">
                <Avatar staticPath="/img/aisearch.png" size={8} staticText="Azure AI Search" />
            </div>
            <div className="flex-1 bg-gray-100 rounded-lg p-2 pl-5 border-gray-300 border">
                <div className="content">
                    <div className="inputs">
                        Search provider:
                        <button className="btn" onClick={toggleExpanded}>({expanded ? 'Close results' : 'Expand results'})</button>
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
            </div>
        </div>
        <div className="flex-gorw-0 flex-shrink-0 w-24">&nbsp;</div>
    </div>;
};

export const AssistantMessage = ({ message }: ChatMessageProps<AiAssistantMessage>) => {
    let dereferenced = message.content;

    // const [refs, setRefs] = useState<Record<string, string>>({});
    useEffect(() => {
        const references = dereferenced.match(/<Reference id="[^"]*"\/>/g);
        const refs: Record<string, unknown> = {};
        if (references) {
            references.forEach((ref, i) => {
                refs[ref] = `[^${i + 1}]`;
                dereferenced = dereferenced.replace(ref, `[^${i + 1}]`);
                dereferenced += `\n\n[^${i + 1}]: ${ref}`;
            });
        }


    }, [message.content]);

    return <div className="flex">
        <div className="flex-gorw-0 flex-shrink-0 w-4">&nbsp;</div>
        <div className="flex-1 relative">
            <div className="header absolute -left-6">
                <Avatar staticPath="/img/gpt.png" size={8} staticText="GPT" />
            </div>
            <div className="flex-1 bg-gray-100 rounded-lg p-2 pl-5 border-gray-300 border">
                <div className="date text-xs text-gray-700 flex flex-row">
                    <div className="flex-0">
                        Sent {new Date(message.timestamp).toLocaleString()}
                    </div>
                </div>
                <div className="content">
                    <Markdown remarkPlugins={[remarkGfm]}>
                        {dereferenced}
                    </Markdown>
                </div>
            </div>
        </div>
        <div className="flex-gorw-0 flex-shrink-0 w-24">&nbsp;</div>
    </div>;
};