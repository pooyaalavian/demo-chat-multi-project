import { useParams, Link } from 'react-router-dom';
import { ReactNode, useEffect, useState } from "react";
import { deleteConversation, fetchBlobSasToken, fetchFiles, fetchConversations, fetchTopic } from '../../api/internal';
import { File } from '../../types/file';
import { Conversation } from '../../types/conversation';
import { TopicUser, } from '../../types/user';
import { Topic } from '../../types/topic';
import { DeleteIcon, FileSymlinkIcon } from '@fluentui/react-icons-mdl2';


const FilePanel = ({ file, topicId }: { file: File, topicId: string }) => {
    // const [showPdf, setShowPdf] = useState(false);
    // const [pdfUrl, setPdfUrl] = useState('');
    const sendToBlob = async () => {
        const token = await fetchBlobSasToken(topicId, file.file);
        const url = `${file.file}?${token}`;
        window.open(url, '_blank');
        // setShowPdf(true);
        // setPdfUrl(url);
    }
    return (<div className='mb-2'>
        <div className="bg-slate-100 p-1">
            <div className="flex">
                <div className="flex-1">
                    <Link to={`/topics/${topicId}/files/${file.id}`}>
                        <div className="">
                            {file.filename}
                        </div>
                        {file.description && <p className='text-sm text-gray-600'>{file.description}</p>}
                    </Link>
                </div>
                <div className="flex-0">
                    <button className="hover:bg-sky-800 hover:text-sky-50 p-1" onClick={sendToBlob} title="Go to document">
                        <FileSymlinkIcon />
                    </button>
                </div>
            </div>
        </div>
    </div>)
};

const ConversationPanel = ({ conversation, topicId, onDelete }: { conversation: Conversation; onDelete: () => void; topicId: string }) => {

    return (<div className='mb-2'>
        <div className="bg-slate-100 p-1">
            <div className="flex">
                <div className="flex-1">
                    <Link to={`/topics/${topicId}/conversations/${conversation.id}`}>
                        <div className="">
                            {conversation.name}
                            {!conversation.messages.length && <span className="text-xs text-gray-500"> (No messages yet)</span>}
                            {conversation.messages.length > 0 && <span className="text-xs text-gray-500"> (last updated {new Date(conversation.messages[conversation.messages.length - 1].timestamp).toLocaleString()})</span>}
                        </div>
                        {conversation.description && <p className='text-sm text-gray-600'>{conversation.description}</p>}
                    </Link>
                </div>
                <div className="flex-0">
                    <button className="hover:bg-sky-800 hover:text-sky-50 p-1" onClick={onDelete} title={`Delete ${conversation.name}`}>
                        <DeleteIcon />
                    </button>
                </div>
            </div>
        </div>
    </div>)
};

export const UsersPanel = () => {
    const [users, setUsers] = useState<TopicUser[]>([]);
    useEffect(() => {
        // fetchUsers(topic.ownerIds, topic.memberIds).then((data) => setUsers(data));
        setUsers([
            { id: '1', firstName: 'Pooya', email: '', userId: '', lastName: 'Alavian', role: 'owner' },
            { id: '2', firstName: 'John', email: '', userId: '', lastName: 'Smith', role: 'member' },
            { id: '3', firstName: 'Bill', email: '', userId: '', lastName: 'Gates', role: 'member' },
        ]);
    }, []);
    return (
        <div>
            <h2>Topic Members</h2>
            <button className="btn">Add new user</button>
            <ul>
                {users.map((user) => <li key={user.id}>
                    [{user.role}] {user.firstName}
                    <button className="btn text-underline">(change role)</button>
                    <button className="btn text-underline">(delete)</button>
                </li>)}
            </ul>
        </div>
    )
};
interface PanelProps { children: ReactNode, title: string, actionBtn?: { title: string; to: string } }
const Panel = ({ children, title, actionBtn }: PanelProps) => {
    return (
        <div className="panel my-2 border border-1">
            <div className="flex flex-col">
                <div className="flex-0 p-2 text-xl border-b text-white bg-blue-900">
                    <div className="flex flex-row items-center justify-between">
                        <div className="title">
                            {title}
                        </div>
                        <div className="btn text-sm">
                            {actionBtn && <Link to={actionBtn.to}
                                className="p-1 rounded-sm bg-white text-blue-800 cursor-pointer hover:bg-sky-500 hover:text-white">
                                {actionBtn.title}
                            </Link>}
                        </div>
                    </div>
                </div>
                <div className="flex-1 p-2 overflow-x-hidden">
                    {children}
                </div>
            </div>
        </div>
    )
}

export const SingleTopic = () => {
    const { topicId } = useParams();
    const [topic, setTopic] = useState<Topic | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
        if (topicId) {
            fetchConversations(topicId).then((data) => setConversations(data));
            fetchFiles(topicId).then((data) => setFiles(data));
        }
    }, [topicId]);

    const handleConversationDelete = (conversationId: string) => {
        if (!topicId) return;
        console.log('Delete conversation');
        deleteConversation(topicId, conversationId).then((data) => {
            console.log(data);
            fetchConversations(topicId).then((data) => setConversations(data));
        });
    }
    useEffect(() => {
        if (topicId) {
            fetchTopic(topicId).then((data) => setTopic(data));
        }
    }, [topicId]);
    if (!topic) return <div>Loading...</div>;

    const handleExportChatHistory = () => {
        const data: unknown[] = [];
        conversations.forEach((conversation) => {
            conversation.messages.forEach((message) => {
                if (message.role === 'user' && message.agent === 'search-assistant') return;
                const name = (message.role === 'user' && message.agent === 'human') ? message.name : 'AI';
                const resources: string[] = [];
                if (message.role === 'assistant') {
                    // regex to match <Reference id="..." /> and extract the id using
                    const regex =/<ref.* id="([^"]*)"\/>/gi;
                    const matches = message.content.matchAll(regex);
                    for (const match of matches) {
                        resources.push(match[1]);
                    }
                }
                data.push({
                    Conversation: conversation.name,
                    Timestamp: '"' + new Date(message.timestamp).toLocaleString() + '"',
                    From: name,
                    Content: '"' + message.content.replace(/"/g, '""').replace(/,/g, ',') + '"',
                    Resources: resources.join(','),
                });
            });
        });
        const cols = ['Conversation', 'Timestamp', 'From', 'Content', 'Resources'];
        const csv = cols.join(',') + '\n' + data.map((row: any) => cols.map(c => row[c]).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        //download it
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chat-history.csv';
        a.click();
    };

    return (
        <div className="flex flex-col">
            <div className="top flex-0">
                <h1 className="text-xl">{topic.name}</h1>
                <h2 className="text-md text-gray-500">{topic.description}</h2>
            </div>
            <div className="main flex-1">
                <div className="flex flex-col space-between">
                    <div className=" flex-1">
                        <Panel title="Files" actionBtn={{ to: `/topics/${topicId}/files/new`, title: 'Upload New File' }}>
                            {topicId && files.map((file, id) => <FilePanel file={file} key={id} topicId={topicId} />)}
                        </Panel>
                    </div>
                    <div className=" flex-1">
                        <Panel title="Conversations" actionBtn={{ to: `/topics/${topicId}/conversations/new`, title: 'Start a New Conversation' }}>
                            {topicId && conversations.map((conversation, id) => <ConversationPanel conversation={conversation} key={id} onDelete={() => handleConversationDelete(conversation.id)} topicId={topicId} />)}
                            <div className="border-t border-gray-400 pt-2">
                                <button onClick={handleExportChatHistory}
                                    className="p-1 rounded-sm bg-whiteborder border-blue-800 text-blue-800 cursor-pointer hover:bg-sky-500 hover:text-white">
                                    Export chat history to Excel
                                </button>
                            </div>
                        </Panel>
                    </div>
                    {/* <div className="flex-1">
                        <Panel title="Users">
                            <UsersPanel />
                        </Panel>
                    </div> */}
                </div>
            </div>
        </div>
    )
};