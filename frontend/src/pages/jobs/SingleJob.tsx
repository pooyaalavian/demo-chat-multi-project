import { useNavigate, useParams, } from 'react-router-dom';
import { useEffect, useState, } from "react";
import { BackToTopic } from '../topics/BackToTopic';
import { deleteJob, fetchJob, resubmitJob } from '../../api/internal';
import { LoadingBar } from '../../components/LoadingBar';
import { Job, JobResult } from '../../types/job';

const JobResultEl = ({ result }: { result: JobResult }) => {
    return <div className="flex flex-row">
        <div className="flex-0 w-16">{result.page}</div>
        <div className="flex-1"><pre className='whitespace-pre-wrap'>{result.result.answer.join('\n\n')}</pre></div>
        {/* <div className="flex-1">{showRaw?result.result:''}</div> */}
    </div>
}

const JobResults = ({ results }: { results: JobResult[] }) => {
    const sorted = results.sort((a, b) => a.page - b.page);
    return <div className="flex flex-col">
        {sorted.map((r, i) => <JobResultEl key={i} result={r} />)}
    </div>
}

export const SingleJob = () => {
    const { topicId, jobId } = useParams();
    const [job, setJob] = useState<Job | null>(null);
    const [deleteDisabled, setDeleteDisabled] = useState(false);
    const [resubmitDisabled, setResubmitDisabled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!topicId || !jobId) return;
        fetchJob(topicId, jobId).then(setJob);

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
        if(!job ||!job.results) return;
        const results= job.results;
        const csv = [];
        csv.push('page,answer');
        results?.forEach(r => {
            r.result.answer.forEach((a:string) => {
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
        <div className="flex flex-col">
            <div className="flex-0 h-full text-lg p-1 rounded-t-md bg-gray-100 border border-gray-100">
                {job.question}
            </div>
            <div className="status">
                Job status: {job.status}
                {job.error ? <div className="text-red-600">Error: {job.error}</div> : null}
                {usage ? <div className="text-sm">
                    Usage: {usage.prompt_tokens} prompt tokens,
                    {usage.completion_tokens} completion tokens,
                    {usage.total_tokens} total tokens</div> : null}
            </div>
            {job.results ? <JobResults results={job.results} /> : null}
            <div className="">
                <div className="flex flex-row">
                    <div className="flex-1"></div>
                    <div className="flex-0">
                        <button className="mr-2 btn bg-green-600 text-white p-2 rounded-md hover:bg-green-500"
                            onClick={downloadAsCsv}>
                            Download as CSV
                        </button>
                        <button className="mr-2 btn bg-yellow-400 text-black p-2 rounded-md hover:bg-yellow-300"
                            disabled={resubmitDisabled}
                            onClick={resubmitMyJob}>
                            {resubmitDisabled ? '...' : 'Resubmit this job'}
                        </button>
                        <button className="btn bg-red-700 text-white p-2 rounded-md hover:bg-red-600"
                            disabled={deleteDisabled}
                            onClick={deleteMyJob}>
                            {deleteDisabled ? '...' : 'Delete this job'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </>
};