import { useState, } from "react";
import { fetchBlobSasToken, } from '../../../api/internal';
import { JobResult, JobResultV2, JobResultV2_Finding, } from '../../../types/job';
import { ReferencePopup } from "../../conversations/reference-popup";
import { createPortal } from "react-dom";
import { File } from '../../../types/file';


const JobResultEl = ({ result, finding, file, isEvenRow }: { result: JobResult<JobResultV2>; finding: JobResultV2_Finding; file?: File; isEvenRow: boolean }) => {
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
    const evenOddClass = (isEvenRow ? 'bg-gray-100' : 'bg-white') + ' whitespace-pre-wrap';
    return <div className="flex flex-row">
        <div className="flex-0 w-12 text-center">
            <button className="text-underline text-blue-500" onClick={showReferencePopup}>
                {result.page}
            </button>
        </div>
        <div className="flex-1"><pre className={evenOddClass}>{finding.clause_address}</pre></div>
        <div className="flex-1"><pre className={evenOddClass}>{finding.clause}</pre></div>
        {showReference && file && createPortal(<ReferencePopup path={file.file + '?' + sasToken} page={result.page.toFixed(0)} onClose={() => setShowReference(false)} />, document.body)}

    </div>
}

export const JobResultsRendererV2 = ({ results, files, }: { results: JobResult<JobResultV2>[]; files: File[] }) => {
    const sorted = results.sort((a, b) => a.page - b.page)
        .filter(result => result.result.findings && result.result.findings.length)
        .map(result => result.result.findings.map(finding => ({ finding, result })))
        .reduce((acc, val) => acc.concat(val), []);

    return <div className="flex flex-col">
        <div className="flex flex-row">
            <div className="flex-0 w-12 font-bold">Page</div>
            <div className="flex-1 font-bold">Clause</div>
            <div className="flex-1 font-bold">Text</div>
        </div>
        {sorted.map((r, i) => <JobResultEl key={i} isEvenRow={i % 2 == 0} result={r.result} finding={r.finding} file={files[0]} />)}
    </div>
}