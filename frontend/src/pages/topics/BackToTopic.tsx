import { Link } from "react-router-dom";

interface BackToTopicProps {
    topicId: string | undefined;
}
export const BackToTopic = ({ topicId }: BackToTopicProps) => {
    if (!topicId) return null;
    return <div className="flex-0 h-8">
        <Link to={`/topics/${topicId}`}>
            <span className="rounded-full bg-blue-500 text-white px-2 text-sm">
                &lt;Back to topic
            </span>
        </Link>
    </div>
};