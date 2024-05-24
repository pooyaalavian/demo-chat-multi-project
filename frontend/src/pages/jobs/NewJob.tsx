import { useParams, useNavigate } from 'react-router-dom';
import { BaseSyntheticEvent, useEffect, useState, } from "react";
import { BackToTopic } from '../topics/BackToTopic';
import { createJob, fetchFiles } from '../../api/internal';
import { Job, JobType } from '../../types/job';
import { File } from '../../types/file';


export const NewJob = () => {
    const [error, setError] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [jobtype, setJobtype] = useState<JobType>('wordSearch');
    const [btnDisabled, setBtnDisabled] = useState(false);
    const { topicId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (!topicId) return;
        fetchFiles(topicId).then(f => setFiles(f));

    }, [topicId]);

    const handleSubmit = async (event: BaseSyntheticEvent) => {
        setBtnDisabled(true);
        setError('');
        event.preventDefault();
        if (!topicId) return console.error('No topicId');

        const jobType = event.target.querySelector('input[name="jobtype"]:checked').value as JobType;
        const systemPrompt = event.target.querySelector('#systemprompt')?.value;
        const question = event.target.querySelector('#question').value;
        // const llm = event.target.querySelector('input[name="llm"]:checked').value;
        const llm = 'gpt-4o';

        const selectedFiles = files.map(f => ({
            fileId: f.id,
            pages: event.target.querySelector(`#page_file${f.id}`).value||'*',
        })).filter(f => event.target.querySelector(`#file${f.fileId}`).checked);
        
        if (selectedFiles.length === 0) {
            setError('Please select at least one file.');
            setBtnDisabled(false);
            return;
        }

        const body: Partial<Job> = {
            jobType,
            systemPrompt,
            question,
            llm,
            selectedFiles,
        };
        try {
            console.log(body);
            const res = await createJob(topicId, body);
            setBtnDisabled(false);
            navigate(`/topics/${topicId}/jobs/${res.id}`);
        }
        catch (e) {
            setError((e as Error).message);
            setBtnDisabled(false);
        }
    };

    const updateJobtype = (event: BaseSyntheticEvent) => {
        setJobtype(event.target.value as JobType);
    };


    return (<>
        <BackToTopic topicId={topicId} />
        <form onSubmit={handleSubmit}>
            <div className="flex flex-col">

                <h1 className="text-2xl font-bold">Create a New Job</h1>

                <div className="flex-1 m-1 border-b shadow-gray-300 shadow-sm">
                    <div className="flex items-center">
                        <span className="flex-0 p-2 w-32">Job Type</span>
                        <div className="bg-blue-50 p-2 w-full flex-1" >
                            <span className="mr-4">
                                <input type="radio" id="wordsearch" name="jobtype" value="wordSearch" defaultChecked={true} onChange={updateJobtype} />
                                <label htmlFor="wordsearch">Word Search</label>
                            </span>
                            <span className="mr-2">
                                <input type="radio" id="genericquestion" name="jobtype" value="genericQuestion" onChange={updateJobtype} />
                                <label htmlFor="genericquestion">Generic Question</label>
                            </span>
                        </div>
                    </div>
                </div>

                {jobtype === 'wordSearch' &&
                    <div className="flex-1 m-1 border-b shadow-gray-300 shadow-sm">
                        <div className="flex items-center">
                            <span className="flex-0 p-2 w-32">Keyword(s)</span>
                            <input type="text" id="question" placeholder={'Keywords here (for example,"Seal, pump"). We recommend one or two keywords for better accuracy.'} className="bg-blue-50 p-2 w-full flex-1" />
                        </div>
                    </div>
                }

                {jobtype === 'genericQuestion' && <>
                    <div className="flex-1 m-1 border-b shadow-gray-300 shadow-sm">
                        <div className="flex items-center">
                            <span className="flex-0 p-2 w-32">Question</span>
                            <input type="text" id="question" placeholder={'Type your question here. This question will be asked from each page of your document.'} className="bg-blue-50 p-2 w-full flex-1" />
                        </div>
                    </div>
                    <div className="flex-1 m-1 border-b shadow-gray-300 shadow-sm">
                        <div className="flex items-center">
                            <span className="flex-0 p-2 w-32">Model instructions</span>
                            <textarea id="systemprompt" placeholder={'Type additional instructions here. These instructions help the LLM perform your task more accurately.'} className="bg-blue-50 p-2 w-full flex-1" rows={4} />
                        </div>
                    </div>
                </>
                }


                {/* <div className="flex-1 m-1 border-b shadow-gray-300 shadow-sm">
                    <div className="flex items-center">
                        <span className="flex-0 p-2 w-32">Model</span>
                        <div className="bg-blue-50 p-2 w-full flex-1" >
                            <span className="mr-4">
                                <input type="radio" id="gpt-35-turbo" name="llm" value="gpt-35-turbo" />
                                <label htmlFor="gpt-35-turbo">GPT-3.5 Turbo</label>
                            </span>
                            <span className="mr-2">
                                <input type="radio" id="gpt-4" name="llm" value="gpt-4" defaultChecked={true} />
                                <label htmlFor="gpt-4">GPT-4</label>
                            </span>
                        </div>
                    </div>
                </div> */}

                <div className="flex-1 m-1 border-b shadow-gray-300 shadow-sm">
                    <div className="flex items-center">
                        <span className="flex-0 p-2 w-32">Files</span>
                        <div className="bg-blue-50 p-2 w-full flex-1" >
                            {files.map(f => ({ ...f, safe_id: 'file' + f.id })).map((f, i) =>
                                <div key={i} className="flex items-center">
                                    <input type="checkbox" id={f.safe_id} name={f.safe_id} value={f.safe_id} />
                                    <label htmlFor={f.safe_id}>{f.filename}</label>
                                    <div className="w-3"></div>
                                    <input className='px-2 py-1 flex-1' type="text" name={`page_${f.safe_id}`} id={`page_${f.safe_id}`} placeholder='Pages (leave empty for all pages)' />
                                </div>)}
                        </div>
                    </div>
                </div>

                <div className="flex-1 m-1">
                    <input type="submit" value={!btnDisabled ? "Submit" : "..."} className="cursor-pointer rounded-lg border p-2 border-gray-800 hover:bg-blue-950 hover:text-white" disabled={btnDisabled} />
                </div>
                {error && <div className="flex-1 bg-red-100 text-red-950">{error}</div>}

            </div>
        </form>
    </>);
};