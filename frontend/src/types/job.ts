interface JobProgress {
    state: 'queued' | 'running' | 'completed' | 'failed';

}

type PageIdentifier = string | '*' | '3-5' | '2,3,4' | '5-';

interface JobFile {
    fileId: string;
    pages: PageIdentifier;
    keywordSearch?: string;
}

export interface Job {
    id: string;
    topicId: string;
    type: 'job';
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    progress: JobProgress;
    files: JobFile[];
}

export interface JobResult {
    id: string;
    topicId: string;
    jobId: string;
    type: 'jobresult';
    result: string;
    fileId: string;
    pageNumber: number;
    createdAt: string;
    updatedAt: string;
}