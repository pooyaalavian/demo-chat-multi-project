import { useEffect, useState } from "react";
import { AiAssistantMessage, AnyMessage, CogSearchResult, HumanMessage, SearchUserMessage } from "../../types/conversation";
import Markdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import supersub from "remark-supersub";
import { Avatar } from "../../components/Avatar";
import { useAccount } from "@azure/msal-react";
import { LoadingBar } from "../../components/LoadingBar";
import { fetchBlobSasToken, fetchFile, fetchSearchResults } from "../../api/internal";
import { useParams } from "react-router-dom";
import { File } from "../../types/file";
import { ReferencePopup } from "./reference-popup";
import { createPortal } from "react-dom";


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
                    <Markdown remarkPlugins={[remarkGfm, supersub]}>
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

const ReferenceItem = ({ referenceId, id }: { referenceId: string, id: number; }) => {
    const { topicId } = useParams();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<CogSearchResult | null>(null);
    const [fileData, setFileData] = useState<File | null>(null);
    const [sasToken, setSasToken] = useState<string>(''); 
    const [showReference, setShowReference] = useState(false);

    useEffect(() => {
        if (topicId === undefined) return;
        fetchSearchResults(topicId, referenceId).then(data => setResult(data));
    }, [topicId]);

    useEffect(() => {
        if (topicId === undefined) return;
        if (result === null) return;
        fetchFile(topicId, result.fileId).then(async data => {
            setFileData(data);
            const token = await fetchBlobSasToken(topicId,data.file);
            setLoading(false);
            setSasToken(token);
        });
    }, [topicId, result]);

    const handleRefClick = () => {
        if (result === null) return;
        if (fileData === null) return;
        console.log('Open file', fileData);
        setShowReference(true);
    };

    return <div className="overflow-hidden border border-gray-300 mt-1 px-1 bg-white rounded-md flex items-center relative cursor-pointer" >
        
        <div className="text-lg text-blue-600" onClick={handleRefClick}>
            [{id}]
        </div>
        {result && fileData && <div className="text-xs text-gray-700" onClick={handleRefClick}>
            {fileData.filename} - Page {result.pageNumber} 
            {result.truncatedStart && 'and possibly previous pages'}
            {result.truncatedEnd && 'and possibly following pages'}
        </div>}
        {loading && <div className="absolute bottom-0 left-0 right-0"><LoadingBar /></div>}
        {result && fileData && showReference
            && createPortal(<ReferencePopup path={fileData.file+'?'+sasToken} page={result.pageNumber} onClose={() => setShowReference(false)} />, document.body)}
    </div>;
};

export const AssistantMessage = ({ message }: ChatMessageProps<AiAssistantMessage>) => {
    const { content, references } = message;

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
                    <Markdown remarkPlugins={[remarkGfm, supersub]}>
                        {content}
                    </Markdown>
                    <div className="flex flex-col">
                        {references.length > 0 && <div className="text-lg text-blue-600">References:</div>}
                        {references.map((ref, key) => <ReferenceItem referenceId={ref} id={key + 1} key={key} />)}
                    </div>
                </div>
            </div>
        </div>
        <div className="flex-gorw-0 flex-shrink-0 w-24">&nbsp;</div>
    </div>;
};