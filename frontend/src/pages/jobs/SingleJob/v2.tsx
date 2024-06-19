import { useState, SyntheticEvent } from "react";
import { fetchBlobSasToken, } from '../../../api/internal';
import { JobResult, JobResultV2, JobResultV2_Finding, OnDelete, } from '../../../types/job';
import { ReferencePopup } from "../../conversations/reference-popup";
import { createPortal } from "react-dom";
import { File } from '../../../types/file';
import { ChromeCloseIcon } from '@fluentui/react-icons-mdl2';
// import { DeleteIcon, PageEditIcon, ChromeCloseIcon } from '@fluentui/react-icons-mdl2';
// import { LoadingSpinner } from "../../../components/LoadingSpinner";



const ModifyFindingPopup = ({ finding, result, onClose }: { result: JobResult<JobResultV2>; finding: JobResultV2_Finding; onClose: () => void }) => {

    const _onClose = (e: SyntheticEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
    }

    return (
        <div className='fixed top-0 left-0 w-full h-full  backdrop-blur-sm' onClick={_onClose}>
            <div className="h-full flex items-center justify-center w-full" onClick={(e) => e.stopPropagation()}>
                <div className="bg-white border border-gray-500 w-4/5" >
                    <div className="relative w-full h-full">
                        <div className="h-10">
                            <button onClick={_onClose}
                                className="border border-gray-300 bg-gray-100 cursor-pointer h-8 w-8 flex items-center justify-center absolute top-1 right-1">
                                <ChromeCloseIcon />
                            </button>
                        </div>
                        <div className="px-4 font-bold">Modify clause address for excel export</div>
                        <div className="p-4 w-128">
                            <div className="flex flex-row">
                                <div className="flex-0 w-36">Page</div>
                                <div className="flex-1"><div className="border p-1 border-blue-300 rounded-md bg-gray-100 text-gray-600">{result.page}</div></div>
                            </div>
                            <div className="flex flex-row pt-2">
                                <div className="flex-0 w-36">Clause Address</div>
                                <div className="flex-1"><input className="border-2 p-1 border-blue-300 rounded-md w-full" type="text" value={finding.clause_address} /></div>
                            </div>
                            <div className="flex flex-row pt-2">
                                <div className="flex-0 w-36">Clause</div>
                                <div className="flex-1"><div className="border p-1 border-blue-300 rounded-md bg-gray-100 text-gray-600">{finding.clause}</div></div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

        </div>
    );
};

const JobResultEl = ({ result, finding, file, isEvenRow, }: { result: JobResult<JobResultV2>; finding: JobResultV2_Finding; file?: File; isEvenRow: boolean, onDelete: OnDelete }) => {
    const [showReference, setShowReference] = useState(false);
    const [showModify, setShowModify] = useState(false);
    // const [showDelete, setShowDelete] = useState(true);
    const [sasToken, setSasToken] = useState<string>('');
    // if(!result.result.answer || result.result.answer.length==0) return null;

    const showReferencePopup = async () => {
        console.log('showReferencePopup', result, file);
        if (!file || !result) return;
        const sasToken = await fetchBlobSasToken(result.topicId, file.file);
        setSasToken(sasToken);
        setShowReference(true);
    };
    const sanitizedClause = { __html: finding.clause };
    const evenOddClass = (isEvenRow ? 'bg-gray-50' : 'bg-white') + ' border-b border-gray-300 pb-2';

    // const deleteFinding = () => {
    //     const findingId = result.result.findings.indexOf(finding);
    //     const jobId = result.jobId;
    //     const resultId = result.id;
    //     const topicId = result.topicId;
    //     setShowDelete(false);
    //     deleteJobResultFinding(topicId, jobId, resultId, findingId).then(() => onDelete(topicId, jobId, resultId, {findingId})).then(() => setShowDelete(true));
    // };

    // const updateFinding = () => {
    //     console.log('deleteFinding', result, finding);
    //     setShowModify(true);
    // };
    return <div className="flex flex-row items-stretch">
        <div className={"flex-0 w-12 text-center " + evenOddClass}>
            <button className="text-underline text-blue-500" onClick={showReferencePopup}>
                {result.page}
            </button>
        </div>
        <div className={"flex-0 w-4 " + evenOddClass}>
            {/*
            {showDelete &&<button className="text-underline text-blue-500" onClick={deleteFinding} title="Delete this entry from results">
                <DeleteIcon />
            </button>}
            {!showDelete && <div className="text-gray-500"><LoadingSpinner/></div>}
             <button className="text-underline text-blue-500" onClick={updateFinding} title="Modify Clause">
                <PageEditIcon />
            </button> */}
        </div>
        <div className={"flex-0 w-48 pr-4 " + evenOddClass} title={result.file.filename}><pre className="overflow-hidden">{result.file.filename}</pre></div>
        <div className={"flex-0 w-36 " + evenOddClass}><pre className='whitespace-pre-wrap'>{finding.clause_address}</pre></div>
        <div className={"flex-1 " + evenOddClass} dangerouslySetInnerHTML={sanitizedClause}></div>
        {showReference && file && createPortal(<ReferencePopup path={file.file + '?' + sasToken} page={result.page.toFixed(0)} onClose={() => setShowReference(false)} />, document.body)}
        {showModify && createPortal(<ModifyFindingPopup finding={finding} result={result} onClose={() => setShowModify(false)} />, document.body)}

    </div>
}

export const JobResultsRendererV2 = ({ results, files, onDelete }: { results: JobResult<JobResultV2>[]; files: File[]; onDelete: OnDelete }) => {
     const sorted = results.sort((a, b) => a.page - b.page)
        .sort((a, b) => a.file.filename.localeCompare(b.file.filename))
        .filter(result => result.result.findings && result.result.findings.length)
        .map(result => result.result.findings.map(finding => ({ finding, result })))
        .reduce((acc, val) => acc.concat(val), []);

    return <div className="flex flex-col result-v2">
        <div className="flex flex-row">
            <div className="flex-0 w-12 font-bold">Page</div>
            <div className="flex-0 w-4 font-bold"></div>
            <div className="flex-0 w-48 pr-4 font-bold">File</div>
            <div className="flex-0 w-36 font-bold">Clause</div>
            <div className="flex-1 font-bold">Text</div>
        </div>
        {sorted.map((r, i) => <JobResultEl key={i} isEvenRow={i % 2 == 0} result={r.result} finding={r.finding} file={files[0]} onDelete={onDelete} />)}
    </div>
}