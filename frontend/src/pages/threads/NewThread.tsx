import { useParams, useNavigate } from 'react-router-dom';
import { BaseSyntheticEvent, useState, } from "react";
import { BackToTopic } from '../topics/BackToTopic';
import { createThread } from '../../api/internal';


export const NewThread = () => {
    const [error, setError] = useState('');
    const { topicId } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (event: BaseSyntheticEvent) => {
        setError('');
        event.preventDefault();
        console.log(event);
        if (!topicId) return console.error('No topicId');
        const name = event.target.querySelector('#name').value;
        const description = event.target.querySelector('#description').value;
        const body = { name, description };
        try{
            const res = await createThread(topicId, body);
            console.log(res);
            navigate(`/topics/${topicId}/threads/${res.id}`);
        }
        catch(e){
            setError((e as Error).message);
        }
    };


    return (<>
        <BackToTopic topicId={topicId} />
        <form onSubmit={handleSubmit}>
        <div className="flex flex-col">
                <div className="flex-1 m-1 border-b shadow-gray-300 shadow-sm">
                    <div className="flex items-center">
                        <span className="flex-0 p-2 w-32">Name</span>
                        <input type="text" id="name" placeholder="Name" className="bg-blue-50 p-2 w-full flex-1" />
                    </div>
                </div>

                <div className="flex-1 m-1 border-b shadow-gray-300 shadow-sm">
                    <div className="flex items-center">
                        <span className="flex-0 p-2 w-32">Description</span>
                        <textarea id="description" placeholder="Description" className="bg-blue-50 p-2 w-full flex-1" />
                    </div>
                </div>

                <div className="flex-1 m-1">
                    <input type="submit" value="Submit" className="cursor-pointer rounded-lg border p-2 border-gray-800 hover:bg-blue-950 hover:text-white" />
                </div>
                {error && <div className="flex-1 bg-red-100 text-red-950">{error}</div>}

            </div>
        </form>
    </>);
};