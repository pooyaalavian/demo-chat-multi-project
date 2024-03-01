import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from "react";
import { deleteThread, fetchFiles, fetchThreads, fetchTopic } from '../../api/internal';

const FilesPanel = () => {
    let { topicId } = useParams();
    const [files, setFiles] = useState<any[]>([]);
    useEffect(() => {
        if (topicId) {
            fetchFiles(topicId).then((data: any) => setFiles(data));
        }
    }, []);
    return (
        <div>
            <h2>Files</h2>
            <Link to={`/topics/${topicId}/files/new`}>
                <button className="btn p-1 rounded-md border border-gray-800">Upload new file</button>
            </Link >
            <ul>
                {files.map((file: any) => <li key={file.id}>
                    <Link to={`/topics/${topicId}/files/${file.id}`}> {file.name}</Link>
                    <button className="btn text-underline">(delete)</button>
                </li>)}
            </ul>
        </div>
    )
};

const ThreadsPanel = () => {
    let { topicId } = useParams();
    const [threads, setThreads] = useState<any[]>([]);
    useEffect(() => {
        if (topicId) {
            fetchThreads(topicId).then((data: any) => setThreads(data));
        }
    }, []);
    const handleDelete = (threadId:string) => {
        if(!topicId) return;
        console.log('Delete thread');
        deleteThread(topicId, threadId).then((data: any) => {
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
                {threads.map((thread: any) => <li key={thread.id}>
                    <Link to={`/topics/${topicId}/threads/${thread.id}`}>{thread.name}</Link>
                    <button className="btn text-underline" onClick={()=>handleDelete(thread.id)}>(delete)</button>
                </li>)}
            </ul>
        </div>
    )
};

const UsersPanel = ({ topic }: any) => {
    const [users, setUsers] = useState<any[]>([]);
    useEffect(() => {
        // fetchUsers(topic.ownerIds, topic.memberIds).then((data: any) => setUsers(data));
        setUsers([
            { id: 1, name: 'Pooya Alavian', role: 'Owner' },
            { id: 2, name: 'John Smith', role: 'Member' },
            { id: 3, name: 'Bill Gates', role: 'Member' },
        ]);
    }, []);
    return (
        <div>
            <h2>Topic Members</h2>
            <button className="btn">Add new user</button>
            <ul>
                {users.map((user: any) => <li key={user.id}>
                    [{user.role}] {user.name}
                    <button className="btn text-underline">(change role)</button>
                    <button className="btn text-underline">(delete)</button>
                </li>)}
            </ul>
        </div>
    )
};

const Panel = ({ children }: any) => {
    return (
        <div className="panel p-2 bg-gray-100 my-2 rounded-md border border-1 border-gray-800">
            {children}
        </div>
    )
}

export const SingleTopic = () => {
    let { topicId } = useParams();
    const [topic, setTopic] = useState<any>({});
    useEffect(() => {
        if (topicId) {
            fetchTopic(topicId).then((data: any) => setTopic(data));
        }
    }, []);
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
                            <UsersPanel topic={topic} />
                        </Panel>
                    </div>
                </div>
            </div>
        </div>
    )
};