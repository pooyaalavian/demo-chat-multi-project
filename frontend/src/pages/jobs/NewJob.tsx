import { useParams, useNavigate } from 'react-router-dom';
import { BaseSyntheticEvent, useEffect, useState, } from "react";
import { BackToTopic } from '../topics/BackToTopic';
import { createJob, fetchFiles } from '../../api/internal';
import { Job } from '../../types/job';
import { File } from '../../types/file';


export const NewJob = () => {
    const [error, setError] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const { topicId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (!topicId) return;
        fetchFiles(topicId).then(f => setFiles(f));

    }, [topicId]);

    const handleSubmit = async (event: BaseSyntheticEvent) => {
        setError('');
        event.preventDefault();
        if (!topicId) return console.error('No topicId');

        const question = event.target.querySelector('#question').value;
        const llm = event.target.querySelector('input[name="llm"]:checked').value;

        const selectedFiles = files.map(f => ({ fileId: f.id, pages: '*' }))
            .filter(f => event.target.querySelector(`#file${f.fileId}`).checked);

        const body: Partial<Job> = {
            question,
            llm,
            selectedFiles,
        };
        try {
            // console.log(body);
            const res = await createJob(topicId, body);
            navigate(`/topics/${topicId}/jobs/${res.id}`);
        }
        catch (e) {
            setError((e as Error).message);
        }
    };


    return (<>
        <BackToTopic topicId={topicId} />
        <form onSubmit={handleSubmit}>
            <div className="flex flex-col">

                <div className="flex-1 m-1 border-b shadow-gray-300 shadow-sm">
                    <div className="flex items-center">
                        <span className="flex-0 p-2 w-32">Question</span>
                        <input type="text" id="question" placeholder="Question" className="bg-blue-50 p-2 w-full flex-1" />
                    </div>
                </div>

                <div className="flex-1 m-1 border-b shadow-gray-300 shadow-sm">
                    <div className="flex items-center">
                        <span className="flex-0 p-2 w-32">Model</span>
                        <div className="bg-blue-50 p-2 w-full flex-1" >
                            <span className="mr-4">
                                <input type="radio" id="gpt-35-turbo" name="llm" value="gpt-35-turbo" defaultChecked={true}/>
                                <label htmlFor="gpt-35-turbo">GPT-3.5 Turbo</label>
                            </span>
                            <span className="mr-2">
                                <input type="radio" id="gpt-4" name="llm" value="gpt-4" />
                                <label htmlFor="gpt-4">GPT-4</label>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 m-1 border-b shadow-gray-300 shadow-sm">
                    <div className="flex items-center">
                        <span className="flex-0 p-2 w-32">Files</span>
                        <div className="bg-blue-50 p-2 w-full flex-1" >
                            {files.map(f => ({ ...f, safe_id: 'file' + f.id })).map((f, i) => <div key={i} className="flex items-center">
                                <input type="checkbox" id={f.safe_id} name={f.safe_id} value={f.safe_id} />
                                <label htmlFor={f.safe_id}>{f.filename}</label>
                            </div>)}
                        </div>
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