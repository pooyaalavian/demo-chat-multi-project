import { useNavigate, useParams, } from 'react-router-dom';
import { useEffect, useState, } from "react";
import { BackToTopic } from '../topics/BackToTopic';
import { deleteFile, fetchFile } from '../../api/internal';
import { File, FileProgress } from '../../types/file';
import { LoadingBar } from '../../components/LoadingBar';
import { PDFIcon, SkypeCheckIcon, TextDocumentIcon } from '@fluentui/react-icons-mdl2';
import { WordDocumentIcon, PowerPointDocumentIcon, ExcelDocumentIcon } from '@fluentui/react-icons-mdl2-branded';
import { LoadingSpinner } from '../../components/LoadingSpinner';


const FileIcon = ({ file }: { file: File }) => {
    const extension = (file.filename.split('.').pop() || '').toLowerCase();
    if (extension === 'pdf') return <PDFIcon />;
    if (extension === 'docx') return <WordDocumentIcon />;
    if (extension === 'pptx') return <PowerPointDocumentIcon />;
    if (extension === 'xlsx') return <ExcelDocumentIcon />;
    if (extension === 'docx') return <WordDocumentIcon />;
    return <TextDocumentIcon />;
}

const STEPS = [
    'upload_to_local',
    'upload_to_blob',
    'process_doc_intelligence',
    'upload_doc_intelligence',
    'perform_chunking',
    'perform_embedding',
    'postprocess_chunks',
    'upload_to_ai_search',
    'complete',
]

const Progress = ({ step, progress }: { step: string; progress: FileProgress[] }) => {
    const item = progress.find((p) => p.step === step);
    const success = item?.success;
    const statusColor = success ? 'bg-green-600' : 'bg-gray-200';
    const niceStep = step.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    return <div className="flex">
        <div className="flex-0 w-16 relative h-12">
            <div className="absolute border-r border-gray-400 h-12 w-6 left-0 z-10"></div>
            <div className={"rounded-full text-center w-8 ml-2 h-8 mt-2 z-20 relative overflow-hidden " + statusColor}>
                {success && <SkypeCheckIcon className='text-white text-3xl' />}
                {/* {!success && <StatusCircleQuestionMarkIcon className='text-blue-600 text-3xl'/>} */}
                {!success && <LoadingSpinner />}
            </div>
        </div>
        <div className="flex-1 p-1 h-12 text-ellipsis overflow-hidden">
            <div className="text-xl h-6">{niceStep}</div>
            <div className="text-sm h-6 text-ellipsis overflow-hidden text-gray-400">{item?.message}</div>
        </div>
    </div>
}

export const SingleFile = () => {
    const { topicId, fileId } = useParams();
    const [file, setFile] = useState<File | null>(null);
    const [refresh, setRefresh] = useState(0);
    const [deleteDisabled, setDeleteDisabled] = useState(false);
    const navigate = useNavigate();


    useEffect(() => {
        async function getFile(topicId?: string, fileId?: string) {
            if (topicId && fileId) {
                const data = await fetchFile(topicId, fileId);
                setFile(data);
                return !!data.processed;
            }
        }
        getFile(topicId, fileId).then((p) => {
            if (!p) setTimeout(() => setRefresh(r => r + 1), 5000);
        });

    }, [topicId, fileId, refresh]);

    const deleteMyFile = async () => {
        if (!topicId || !fileId) return;
        setDeleteDisabled(true);
        await deleteFile(topicId, fileId);
        setDeleteDisabled(false);
        navigate(`/topics/${topicId}`);
    }

    if (!topicId || !fileId || !file) return <LoadingBar />
    return <>
        <BackToTopic topicId={topicId} />
        <div className="flex flex-col">
            <div className="flex-0 h-full text-lg p-1 rounded-t-md bg-gray-100 border border-gray-100">
                <FileIcon file={file} /> {file.filename}
            </div>
            <div className="border border-gray-100 p-1">
                <div className="text-lg">File progress</div>
                <div className="progress-container">
                    {STEPS.map((step, id) => <Progress key={id} step={step} progress={file.progress} />)}
                </div>
                <div className="flex flex-row">
                    <div className="flex-1"></div>
                    <div className="flex-0">
                        <button className="btn bg-red-700 text-white p-2 rounded-md hover:bg-red-600"
                        disabled={deleteDisabled}
                        onClick={deleteMyFile}>
                            {deleteDisabled?'...':'Delete this file'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </>
};