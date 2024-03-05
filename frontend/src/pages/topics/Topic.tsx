import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchTopics } from "../../api/internal";
import { Topic } from "../../types/topic";
import { useAccount } from "@azure/msal-react";

interface TopicItemProps {
    topic: Topic;
    index: number;
}

export const TopicItem = ({ topic, index }: TopicItemProps) => {
    return <div key={index} className="my-1">
        <Link to={`/topics/${topic.id}`}>
            <div className="p-1 border border-gray-700 bg-blue-100 flex items-center">
                <span className="text-bold text-xl pr-3">
                    {topic.name}
                </span>
                <span className="text-sm text-gray-600">{topic.description}</span>
            </div>
        </Link>
    </div>;
}

export const TopicHome = () => {
    const [topics, setTopics] = useState<Topic[]>([]);
    const account = useAccount();

    useEffect(() => {
        fetchTopics().then((data) => setTopics(data));
    }, [account]);

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

        {topics.map((topic, id) => <TopicItem topic={topic} index={id} key={id} />)}
    </>
};