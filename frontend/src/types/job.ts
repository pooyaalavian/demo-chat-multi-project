export type JobStatus = 'queued' | 'running' | 'finished' | 'failed';


type PageIdentifier = string | '*' | '3-5' | '2,3,4' | '5-';

export interface JobFile {
    fileId: string;
    pages: PageIdentifier;
    keywordSearch?: string;
}

export interface Job<T = any> {
    id: string;
    topicId: string;
    type: 'job';
    question: string;
    llm: 'gpt-35-turbo' | 'gpt-4';
    selectedFiles: JobFile[];
    createdAt: string;
    updatedAt: string;
    status: JobStatus;
    error?: string;
    results?: JobResult<T>[];
}

export interface JobResultV1 {
    contextAnswersQuestion: boolean;
    answer: string[];
    error?: string;
}

export interface JobResultV2_Finding {
    clause: string;
    clause_address: string;
    page: string;
};
export interface JobResultV2 {
    findings: JobResultV2_Finding[];
}

export interface JobResult<T = any> {
    id: string;
    topicId: string;
    jobId: string;
    type: 'jobresult';
    result: T;
    fileId: string;
    page: number;
    output_version?: 'extract_v2';
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    }
    createdAt: string;
    updatedAt: string;
}