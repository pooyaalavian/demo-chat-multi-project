export type JobStatus = 'queued' | 'running' | 'completed' | 'failed';


type PageIdentifier = string | '*' | '3-5' | '2,3,4' | '5-';

export interface JobFile {
    fileId: string;
    pages: PageIdentifier;
    keywordSearch?: string;
}

export interface Job {
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
    results?: JobResult[];
}

export interface JobResult {
    id: string;
    topicId: string;
    jobId: string;
    type: 'jobresult';
    result: {
        contextAnswersQuestion: boolean;
        answer: string[];
        error?: string;
    };
    fileId: string;
    page: number;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    }
    createdAt: string;
    updatedAt: string;
}