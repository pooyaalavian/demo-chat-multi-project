import { useParams, } from 'react-router-dom';
import { useEffect, } from "react";
import { BackToTopic } from '../topics/BackToTopic';


export const SingleFile = () => {
    const { topicId, fileId } = useParams();

    useEffect(() => {
    }, []);
    return <>
        <BackToTopic topicId={topicId} />
        <div className="flex flex-col">
            <div className="flex-1 h-full">
                <h1>File {fileId}</h1>
                <div>
                    <h2>Contents...</h2>
                </div>
            </div>
        </div>
    </>
};