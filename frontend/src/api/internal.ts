import { environment } from "../environment";
import { File } from "../types/file";
import { CogSearchResult, Conversation } from "../types/conversation";
import { Topic } from "../types/topic";
import { acquireTokens } from "./msal";
import { Job } from "../types/job";

export const wrappedFetchRaw = async (url: string, options: RequestInit) => {
    const token = await acquireTokens();
    const response = await fetch(
        environment.api + url,
        {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
                'Authorization': `Bearer ${token.idToken}`,
            },
        });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
    }
    return response;
}

export const wrappedFetch = async <T>(url: string, options: RequestInit) => {
    const response = await wrappedFetchRaw(url, options);
    return await response.json() as T;
}

export const fetchTopics = async () => {
    return wrappedFetch<Topic[]>('/topics/', { method: 'GET' });
}

export const fetchTopic = async (topicId: string) => {
    return wrappedFetch<Topic>(`/topics/${topicId}`, { method: 'GET' });
}

export const fetchConversations = async (topicId: string) => {
    return wrappedFetch<Conversation[]>(`/topics/${topicId}/conversations/`, { method: 'GET' });
}

export const fetchConversation = async (topicId: string, conversationId: string) => {
    return wrappedFetch<Conversation>(`/topics/${topicId}/conversations/${conversationId}`, { method: 'GET' });
}

export const sendConversationChat = async (topicId: string, conversationId: string, message: string) => {
    return wrappedFetch<Conversation>(`/topics/${topicId}/conversations/${conversationId}/chat`,
        {
            method: 'POST', body: JSON.stringify({ message })
        });
}

export const fetchFiles = async (topicId: string) => {
    return wrappedFetch<File[]>(`/topics/${topicId}/files/`, { method: 'GET' });
}

export const fetchFile = async (topicId: string, fileId: string) => {
    return wrappedFetch<File>(`/topics/${topicId}/files/${fileId}`, { method: 'GET' });
}

export const fetchBlobSasToken = async (topicId: string, blobUrl: string) => {
    return wrappedFetch<string>(`/topics/${topicId}/files/sas-token?url=${blobUrl}`, { method: 'GET' });
}

export const createTopic = async (body: { name: string; description: string }) => {
    return wrappedFetch<Topic>('/topics/', { method: 'POST', body: JSON.stringify(body) });
}

export const createConversation = async (topicId: string, body: { name: string; description: string }) => {
    return wrappedFetch<Conversation>(`/topics/${topicId}/conversations/`,
        { method: 'POST', body: JSON.stringify(body) }
    );
}

export const deleteConversation = async (topicId: string, conversationId: string) => {
    return wrappedFetch<object>(`/topics/${topicId}/conversations/${conversationId}`, { method: 'DELETE' });
}

export const deleteTopic = async (topicId: string) => {
    return wrappedFetch<object>(`/topics/${topicId}`, { method: 'DELETE' });
}

export const createFile = async (topicId: string, filename: string, data: ArrayBuffer) => {
    const body = new Blob([data], { type: 'application/octet-stream' });
    return wrappedFetch<File>(`/topics/${topicId}/files/`, {
        method: 'POST',
        body,
        headers: {
            'Content-Type': 'application/octet-stream',
            filename,
            'Content-Disposition': `attachment; filename="${filename}"`,
        }
    });

}

export const deleteFile = async (topicId: string, fileId: string) => {
    return wrappedFetch<object>(`/topics/${topicId}/files/${fileId}`, { method: 'DELETE' });
}

export const createUser = async (body: { name: string; email: string }) => {
    return wrappedFetch<{ userId: string }>('/users/', { method: 'POST', body: JSON.stringify(body) });
}

export const fetchSearchResults = async (topicId: string, searchId: string) => {
    return wrappedFetch<CogSearchResult>(`/search/${topicId}/${searchId}`, { method: 'GET' });
};

export const fetchJobs = async (topicId: string) => {
    return wrappedFetch<Job[]>(`/topics/${topicId}/jobs/`, { method: 'GET' });
}

export const fetchJob = async (topicId: string, jobId: string) => {
    return wrappedFetch<Job>(`/topics/${topicId}/jobs/${jobId}`, { method: 'GET' });
}

export const createJob = async (topicId: string, payload: Partial<Job>) => {
    return wrappedFetch<Job>(`/topics/${topicId}/jobs/`, { method: 'POST', body: JSON.stringify(payload) });
}

export const resubmitJob = async (topicId: string, jobId: string) => {
    return wrappedFetch<Job>(`/topics/${topicId}/jobs/${jobId}`, { method: 'PUT' });
}

export const deleteJob = async (topicId: string, jobId: string) => {
    return wrappedFetch<Job>(`/topics/${topicId}/jobs/${jobId}`, { method: 'DELETE' });
}

export const getAppVersion = async () => {
    return wrappedFetch<{ webapp: string; fnapp: string }>('/settings/version', { method: 'GET' });
};

export const downloadJobResultsXlsx = async (topicId: string, jobId: string) => {
    const response = await wrappedFetchRaw(`/topics/${topicId}/jobs/${jobId}/results.xlsx`, {
        method: 'GET',
        headers: { 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = response.headers.get('Content-Disposition')?.split('filename=')[1] || `job-${jobId}.xlsx`; 
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
};