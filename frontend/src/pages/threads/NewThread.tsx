import { useParams, useNavigate } from 'react-router-dom';
import { BaseSyntheticEvent, } from "react";
import { BackToTopic } from '../topics/BackToTopic';
import { createThread } from '../../api/internal';


export const NewThread = () => {
    const { topicId } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (event: BaseSyntheticEvent) => {
        event.preventDefault();
        console.log(event);
        if (!topicId) return console.error('No topicId');
        const name = event.target.querySelector('#name').value;
        const description = event.target.querySelector('#description').value;
        const body = { name, description };
        const res = await createThread(topicId, body);
        console.log(res);
        navigate(`/topics/${topicId}/threads/${res.id}`);
    };


    return (<>
        <BackToTopic topicId={topicId} />
        <form onSubmit={handleSubmit}>
            <label>
                Thread Name:
                <input type="text" id="name" placeholder="Name" className="border border-gray-800" />
            </label>
            <br />
            <br />
            <label>
                Description:
                <input type="text" id="description" placeholder="Description" className="border border-gray-800" />
            </label>
            <br />
            <input className="mt-1 cursor-pointer rounded-md border border-gray-700 p-2" type="submit" value="Submit" />
        </form>
    </>);
};