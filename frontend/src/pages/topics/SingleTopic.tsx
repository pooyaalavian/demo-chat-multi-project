import { useParams, Link } from 'react-router-dom';
import { ReactNode, useEffect, useState } from "react";
import { deleteThread, fetchBlobSasToken, fetchFiles, fetchThreads, fetchTopic } from '../../api/internal';
import { File } from '../../types/file';
import { Thread } from '../../types/thread';
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
    return (<div className='container mb-2'>
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

const ThreadPanel = ({ thread, topicId, onDelete }: { thread: Thread; onDelete: () => void; topicId: string }) => {

    return (<div className='container mb-2'>
        <div className="bg-slate-100 p-1">
            <div className="flex">
                <div className="flex-1">
                    <Link to={`/topics/${topicId}/threads/${thread.id}`}>
                        <div className="">
                            {thread.name}
                            {thread.messages && <span
                                className="ml-2 inline-block align-top rounded-full bg-sky-500 text-sky-50 px-1 text-xs"
                                title={`${thread.messages.length} messages in this thread`}>
                                {thread?.messages?.length}
                            </span>}
                        </div>
                        {thread.description && <p className='text-sm text-gray-600'>{thread.description}</p>}
                    </Link>
                </div>
                <div className="flex-0">
                    <button className="hover:bg-sky-800 hover:text-sky-50 p-1" onClick={onDelete} title={`Delete ${thread.name}`}>
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
    const [threads, setThreads] = useState<Thread[]>([]);
    const [files, setFiles] = useState<File[]>([]);

    useEffect(() => {
        if (topicId) {
            fetchThreads(topicId).then((data) => setThreads(data));
            fetchFiles(topicId).then((data) => setFiles(data));
        }
    }, [topicId]);

    const handleThreadDelete = (threadId: string) => {
        if (!topicId) return;
        console.log('Delete thread');
        deleteThread(topicId, threadId).then((data) => {
            console.log(data);
            fetchThreads(topicId).then((data) => setThreads(data));
        });
    }
    useEffect(() => {
        if (topicId) {
            fetchTopic(topicId).then((data) => setTopic(data));
        }
    }, [topicId]);
    if (!topic) return <div>Loading...</div>;

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
                        <Panel title="Threads" actionBtn={{ to: `/topics/${topicId}/threads/new`, title: 'Start a New Thread' }}>
                            {topicId && threads.map((thread, id) => <ThreadPanel thread={thread} key={id} onDelete={() => handleThreadDelete(thread.id)} topicId={topicId} />)}
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