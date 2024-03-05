import { useParams, useNavigate } from 'react-router-dom';
import { BaseSyntheticEvent, useState, } from "react";
import { BackToTopic } from '../topics/BackToTopic';
import { createFile, } from '../../api/internal';


export const NewFile = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { topicId } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (event: BaseSyntheticEvent) => {
        setError('');
        event.preventDefault();
        console.log(event);
        if (!topicId) return console.error('No topicId');

        const fileField = event.target.querySelector('#file');
        const filename = fileField.files[0].name;
        const data = await fileField.files[0].arrayBuffer();
        console.log({ filename, data });
        try {
            setLoading(true);
            const res = await createFile(topicId, filename, data);
            console.log(res);
            setLoading(false);
            navigate(`/topics/${topicId}`);
        }
        catch (e) {
            setLoading(false);
            setError((e as Error).message);
        }
    };


    return (<>
        <BackToTopic topicId={topicId} />
        <form onSubmit={handleSubmit}>
            <div className="flex flex-col">
                <div className="flex-1 m-1 border-b shadow-gray-300 shadow-sm">
                    <div className="flex items-center">
                        <span className="flex-0 p-2 w-32">File </span>
                        {/* <input type="text" id="name" placeholder="Name" className="bg-blue-50 p-2 w-full flex-1" /> */}
                        <input type="file" id="file" className="bg-blue-50 p-2 w-full flex-1" />
                    </div>
                </div>

                <div className="flex-1 m-1 border-b shadow-gray-300 shadow-sm">
                    <div className="flex items-center">
                        <span className="flex-0 p-2 w-32">Description</span>
                        <textarea id="description" placeholder="Description" className="bg-blue-50 p-2 w-full flex-1" />
                    </div>
                </div>

                <div className="flex-1 m-1">
                    <input type="submit" disabled={loading} value={loading ? "..." : "Submit"} className="cursor-pointer rounded-lg border p-2 border-gray-800 hover:bg-blue-950 hover:text-white" />
                </div>
                {loading && <div className="flex-1 bg-blue-100 text-blue-950">Uploading file. Please be patient. Dependign on your file size this may take upto 5 minutes.</div>}
                {error && <div className="flex-1 bg-red-100 text-red-950">{error}</div>}
            </div>
        </form>
    </>);
};