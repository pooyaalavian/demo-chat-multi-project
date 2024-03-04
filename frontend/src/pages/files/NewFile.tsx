import { useParams, useNavigate } from 'react-router-dom';
import { BaseSyntheticEvent, } from "react";
import { BackToTopic } from '../topics/BackToTopic';
import { createFile, } from '../../api/internal';


export const NewFile = () => {
    const { topicId } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (event: BaseSyntheticEvent) => {
        event.preventDefault();
        console.log(event);
        if (!topicId) return console.error('No topicId');

        const fileField = event.target.querySelector('#file');
        const filename = fileField.files[0].name;
        const data = await fileField.files[0].arrayBuffer();
        console.log({ filename, data });

        const res = await createFile(topicId, filename, data);
        console.log(res);
        navigate(`/topics/${topicId}`);
    };


    return (<>
        <BackToTopic topicId={topicId} />
        <form onSubmit={handleSubmit}>
            <label>
                File :
                <input type="file" id="file" className="border border-gray-800" />
            </label>
            <br />
            <br />
            <input className="mt-1 cursor-pointer rounded-md border border-gray-700 p-2" type="submit" value="Submit" />
        </form>
    </>);
};