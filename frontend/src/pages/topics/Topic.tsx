import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchTopics } from "../../api/internal";

export const TopicItem = ({ topic, index }: any) => {
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
    const [topics, setTopics] = useState<any[]>([]);

    useEffect(() => {
        fetchTopics().then((data: any) => setTopics(data));
    }, []);

    return <>
        <h1>Topics</h1>
        <div className="flex justify-between h-8">
            <div className=""></div>
            <Link to="/topics/new">
                <span className="rounded-lg border p-2 mr-auto border-gray-800 hover:bg-blue-200">
                    Create Topic
                </span>
            </Link>

        </div>
        {topics.map((topic: any, id) => <TopicItem topic={topic} index={id} />)}
    </>
};