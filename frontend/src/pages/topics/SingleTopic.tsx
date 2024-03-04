import { useParams, Link } from 'react-router-dom';
import { ReactNode, useEffect, useState } from "react";
import { deleteThread, fetchFiles, fetchThreads, fetchTopic } from '../../api/internal';
import { File } from '../../types/file';
import { Thread } from '../../types/thread';
import { TopicUser, } from '../../types/user';
import { Topic } from '../../types/topic';

const FilesPanel = () => {
    const { topicId } = useParams();
    const [files, setFiles] = useState<File[]>([]);
    useEffect(() => {
        if (topicId) {
            fetchFiles(topicId).then((data) => setFiles(data));
        }
    }, [topicId]);
    return (
        <div>
            <h2>Files</h2>
            <Link to={`/topics/${topicId}/files/new`}>
                <button className="btn p-1 rounded-md border border-gray-800">Upload new file</button>
            </Link >
            <ul>
                {files.map((file) => <li key={file.id}>
                    <Link to={`/topics/${topicId}/files/${file.id}`}> {file.file}</Link>
                    <button className="btn text-underline">(delete)</button>
                </li>)}
            </ul>
        </div>
    )
};

const ThreadsPanel = () => {
    const { topicId } = useParams();
    const [threads, setThreads] = useState<Thread[]>([]);
    useEffect(() => {
        if (topicId) {
            fetchThreads(topicId).then((data) => setThreads(data));
        }
    }, [topicId]);
    const handleDelete = (threadId: string) => {
        if (!topicId) return;
        console.log('Delete thread');
        deleteThread(topicId, threadId).then((data) => {
            console.log(data);
        });
    }
    return (
        <div>
            <h2>Threads</h2>
            <Link to={`/topics/${topicId}/threads/new`}>
                <button className="btn p-1 rounded-md border border-gray-800">New thread</button>
            </Link >
            <ul>
                {threads.map((thread) => <li key={thread.id}>
                    <Link to={`/topics/${topicId}/threads/${thread.id}`}>{thread.name}</Link>
                    <button className="btn text-underline" onClick={() => handleDelete(thread.id)}>(delete)</button>
                </li>)}
            </ul>
        </div>
    )
};

const UsersPanel = () => {
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

const Panel = ({ children }:{children: ReactNode}) => {
    return (
        <div className="panel p-2 bg-gray-100 my-2 rounded-md border border-1 border-gray-800">
            {children}
        </div>
    )
}

export const SingleTopic = () => {
    const { topicId } = useParams();
    const [topic, setTopic] = useState<Topic|null>(null);
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
                        <Panel><FilesPanel /> </Panel>
                    </div>
                    <div className=" flex-1">
                        <Panel><ThreadsPanel /> </Panel>
                    </div>
                    <div className="flex-1">
                        <Panel>
                            <UsersPanel />
                        </Panel>
                    </div>
                </div>
            </div>
        </div>
    )
};