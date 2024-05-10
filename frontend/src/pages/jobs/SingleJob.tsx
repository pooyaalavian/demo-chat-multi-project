import { useNavigate, useParams, } from 'react-router-dom';
import { useEffect, useState, } from "react";
import { BackToTopic } from '../topics/BackToTopic';
import { deleteJob, downloadJobResultsXlsx, fetchFiles, fetchJob, resubmitJob } from '../../api/internal';
import { LoadingBar } from '../../components/LoadingBar';
import { Job, JobStatus } from '../../types/job';
import { File } from '../../types/file';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { SkypeCircleCheckIcon, SkypeCircleSlashIcon } from '@fluentui/react-icons-mdl2-branded';
import { JobResultsRendererV1 } from './SingleJob/v1';
import { JobResultsRendererV2 } from './SingleJob/v2';



const JobStatusIcon = ({ status }: { status: JobStatus }) => {
    const isSuccess = status === 'finished';
    const isFailed = status === 'failed';
    const isRunning = !(isSuccess || isFailed);
    return <>
    {isSuccess && <SkypeCircleCheckIcon className='text-green-600 text-3xl' />}
    {isFailed && <SkypeCircleSlashIcon className='text-red-600 text-3xl' />}
    {isRunning && <LoadingSpinner />}
    </>
};

export const SingleJob = () => {
    const { topicId, jobId } = useParams();
    const [job, setJob] = useState<Job | null>(null);
    const [refresh, setRefresh] = useState(0);
    const [deleteDisabled, setDeleteDisabled] = useState(false);
    const [resubmitDisabled, setResubmitDisabled] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!topicId) return;
        fetchFiles(topicId).then(setFiles);
    }, [topicId]);

    useEffect(() => {
        if (!topicId || !jobId) return;
        fetchJob(topicId, jobId)
            .then((newjob) => {
                setJob(newjob);
                if (newjob.status !== 'finished' && newjob.status !== 'failed'){
                    console.log('refreshing job', newjob.status);
                    setTimeout(() => setRefresh(r => r + 1), 5000);
                }
            });

    }, [topicId, jobId, refresh]);

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

    const downloadXlsx = ()=>{
        if (!topicId || !jobId) return;
        downloadJobResultsXlsx(topicId, jobId);
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

    const downlaodBehavior = job?.results && job.results[0]?.output_version === 'extract_v2' ? downloadXlsx : downloadAsCsv;

    const ResultRenderer = job?.results && job.results[0]?.output_version === 'extract_v2' ? JobResultsRendererV2 : JobResultsRendererV1; 

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
                    {job.selectedFiles.map(s => files.find(f => f.id === s.fileId)?.filename).join(', ')}
                </div>
                <div className="flex-0 h-full text-lg p-1  bg-gray-100 border border-gray-100">
                    <span className="font-bold">Language model: </span>
                    {job.llm}
                </div>
                <div className="flex-0 h-full text-lg p-1  bg-gray-10 border border-gray-100">
                    <span className="font-bold">Job status: </span>
                    <span className='inline-block'>
                    <JobStatusIcon status={job.status} />

                    </span>
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
                    {job.results ? <ResultRenderer results={job.results} files={files} /> : null}
                </div>
            </div>
            <div className="flex-0 flex flex-col h-full">
                <button className="mb-2 ml-2 btn border border-green-600 text-green-800 p-2 rounded-md hover:bg-green-100"
                    onClick={downlaodBehavior}>
                    Download results
                </button>
                <button className="mb-2 ml-2 btn border border-green-600 text-green-800 p-2 rounded-md hover:bg-green-100"
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