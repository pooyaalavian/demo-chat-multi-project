import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteTopic, fetchTopics } from "../../api/internal";
import { Topic } from "../../types/topic";
import { useAccount } from "@azure/msal-react";
import { DeleteIcon } from "@fluentui/react-icons-mdl2";

interface TopicItemProps {
    topic: Topic;
    index: number;
    onDelete: (topicId: string) => void;
}

export const TopicItem = ({ topic, index, onDelete }: TopicItemProps) => {



    return <div key={index} className="my-1">
        <div className="p-1 border border-gray-700 bg-blue-100 flex items-center">
            <div className="flex-1">
                <Link to={`/topics/${topic.id}`}>
                    <span className="text-bold text-xl pr-3">
                        {topic.name}
                    </span>
                    <span className="text-sm text-gray-600">{topic.description}</span>
                </Link>
            </div>
            <div className="flex-0">
                <button className="hover:bg-sky-800 hover:text-sky-50 p-1" onClick={() => onDelete(topic.id)} title={`Delete ${topic.name}`}>
                    <DeleteIcon />
                </button>
            </div>
        </div>
    </div>;
}

export const TopicHome = () => {
    const [topics, setTopics] = useState<Topic[]>([]);
    const account = useAccount();

    useEffect(() => {
        fetchTopics().then((data) => setTopics(data));
    }, [account]);

    const onDelete = (topicId: string) => {
        console.log(`Delete ${topicId}`);
        deleteTopic(topicId).then(() => {
            fetchTopics().then((data) => setTopics(data));
        });
    }

    return <>
        <div className="flex justify-between items-center mb-2">
            <div className="flex-1">
                <span className="text-3xl">Topics</span>
            </div>
            <div className="flex-0">
                <Link to="/topics/new">
                    <span className="cursor-pointer rounded-lg border p-2 border-gray-800 hover:bg-blue-950 hover:text-white">
                        + Create a New Topic
                    </span>
                </Link>
            </div>
        </div>

        {topics.map((topic, id) => <TopicItem topic={topic} index={id} key={id} onDelete={onDelete} />)}
    </>
};