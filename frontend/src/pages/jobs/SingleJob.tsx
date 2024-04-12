import { useNavigate, useParams, } from 'react-router-dom';
import { useEffect, useState, } from "react";
import { BackToTopic } from '../topics/BackToTopic';
import { deleteJob, fetchBlobSasToken, fetchFiles, fetchJob, resubmitJob } from '../../api/internal';
import { LoadingBar } from '../../components/LoadingBar';
import { Job, JobResult } from '../../types/job';
import { ReferencePopup } from "../conversations/reference-popup";
import { createPortal } from "react-dom";
import { File } from '../../types/file';


const JobResultEl = ({ result , file, isEvenRow}: { result: JobResult;file?:File; isEvenRow:boolean }) => {
    const [showReference, setShowReference] = useState(false);
    const [sasToken, setSasToken] = useState<string>('');
    // if(!result.result.answer || result.result.answer.length==0) return null;

    const showReferencePopup = async () => {
        console.log('showReferencePopup', result, file);
        if (!file || !result) return;
        const sasToken = await fetchBlobSasToken(result.topicId, file.file);
        setSasToken(sasToken);
        setShowReference(true);
    };
    const evenOddClass = (isEvenRow?'bg-gray-100':'bg-white')+' whitespace-pre-wrap';
    return <div className="flex flex-row">
        <div className="flex-0 w-12 text-center">
            <button className="text-underline text-blue-500" onClick={showReferencePopup}>
            {result.page}
            </button>
            </div>
        <div className="flex-1"><pre className={evenOddClass}>{result.result.answer.join('\n\n')}</pre></div>
        {/* <div className="flex-1">{showRaw?result.result:''}</div> */}
        {showReference && file && createPortal(<ReferencePopup path={file.file+'?'+sasToken} page={result.page.toFixed(0)} onClose={() => setShowReference(false)} />, document.body)}

    </div>
}

const JobResults = ({ results, files, }: { results: JobResult[]; files:File[] }) => {
    const sorted = results.sort((a, b) => a.page - b.page).filter(r=>r.result&& r.result.answer && r.result.answer.length>0);
    
    return <div className="flex flex-col">
        <div className="flex flex-row">
            <div className="flex-0 w-12 font-bold">Page</div>
            <div className="flex-1 font-bold">Answer</div>
        </div>
        {sorted.map((r, i) => <JobResultEl key={i} isEvenRow={i%2==0} result={r} file={files[0]}/>)}
    </div>
}

export const SingleJob = () => {
    const { topicId, jobId } = useParams();
    const [job, setJob] = useState<Job | null>(null);
    const [deleteDisabled, setDeleteDisabled] = useState(false);
    const [resubmitDisabled, setResubmitDisabled] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!topicId || !jobId) return;
        fetchJob(topicId, jobId).then(setJob);
        fetchFiles(topicId).then(setFiles);

    }, [topicId, jobId]);

    const deleteMyJob = async () => {
        if (!topicId || !jobId) return;
        setDeleteDisabled(true);
        await deleteJob(topicId, jobId);
        setDeleteDisabled(false);
        navigate(`/topics/${topicId}`);
    }

    const resubmitMyJob = async () => {
        if (!topicId || !jobId) return;
        setResubmitDisabled(true);
        const job = await resubmitJob(topicId, jobId);
        setResubmitDisabled(false);
        setJob(job);
    }

    const downloadAsCsv = () => {
        if (!job || !job.results) return;
        const results = job.results;
        const csv = [];
        csv.push('page,answer');
        results?.forEach(r => {
            r.result.answer.forEach((a: string) => {
                csv.push(`${r.page},"${a}"`);
            })
        });
        const csvStr = csv.join('\n');
        const blob = new Blob([csvStr], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `job-${jobId}.csv`;
        a.click();
    };

    const usage = job?.results?.map(r => r.usage).reduce((acc, u) => ({
        prompt_tokens: acc.prompt_tokens + u.prompt_tokens,
        completion_tokens: acc.completion_tokens + u.completion_tokens,
        total_tokens: acc.total_tokens + u.total_tokens,
    }), { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });

    if (!topicId || !jobId || !job) return <LoadingBar />
    return <>
        <BackToTopic topicId={topicId} />
        <div className="flex">
            <div className="flex-1 flex flex-col">
                <div className="flex-0 h-full text-lg p-1 rounded-t-md bg-gray-100 border border-gray-100">
                    <span className="font-bold">Question: </span>
                    {job.question}
                </div>
                <div className="flex-0 h-full text-lg p-1  bg-gray-10 border border-gray-100">
                    <span className="font-bold">Files used: </span>
                    {job.selectedFiles.map(s=>files.find(f=>f.id===s.fileId)?.filename).join(', ')}
                </div>
                <div className="flex-0 h-full text-lg p-1  bg-gray-100 border border-gray-100">
                    <span className="font-bold">Language model: </span>
                    {job.llm}
                </div>
                <div className="flex-0 h-full text-lg p-1  bg-gray-10 border border-gray-100">
                    <span className="font-bold">Job status: </span>
                    {job.status}
                    {job.error ? <div className="text-red-600">Error: {job.error}</div> : null}
                </div>
                {usage ? <div className="flex-0 h-full text-lg p-1  bg-gray-100 border border-gray-100">
                    <div className="font-bold">Usage: </div>

                    <div className="text-sm">Prompt tokens: {usage.prompt_tokens}</div>
                    <div className="text-sm">Completion tokens: {usage.completion_tokens}</div>
                    <div className="text-sm">Total tokens: {usage.total_tokens}</div>
                </div> : null}
                <div className="flex-0 h-full text-lg p-1  bg-gray-10 border border-gray-100">
                    <div className="font-bold">Results: </div>
                {job.results ? <JobResults results={job.results} files={files}/> : null}
                </div>
            </div>
            <div className="flex-0 flex flex-col h-full">
                <button className="mb-2 ml-2 btn bg-green-600 text-white p-2 rounded-md hover:bg-green-500"
                    onClick={downloadAsCsv}>
                    Download as CSV
                </button>
                <button className="mb-2 ml-2 btn bg-yellow-400 text-black p-2 rounded-md hover:bg-yellow-300"
                    disabled={resubmitDisabled}
                    onClick={resubmitMyJob}>
                    {resubmitDisabled ? '...' : 'Resubmit this job'}
                </button>
                <button className="mb-2 ml-2 btn bg-red-700 text-white p-2 rounded-md hover:bg-red-600"
                    disabled={deleteDisabled}
                    onClick={deleteMyJob}>
                    {deleteDisabled ? '...' : 'Delete this job'}
                </button>
            </div>
        </div>
    </>
};