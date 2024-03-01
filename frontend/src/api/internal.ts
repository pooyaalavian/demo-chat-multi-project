import { environment } from "../environment";

export const wrappedFetch = async <T>(url: string, options: RequestInit) => {
    const response = await fetch(
        environment.api + url,
        {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });
    if (!response.ok) {
        throw new Error(response.statusText);
    }
    return await response.json() as T;
}

export const fetchTopics = async () => {
    return wrappedFetch<{}[]>('/topics/', { method: 'GET' });
}

export const fetchTopic = async (topicId: string) => {
    return wrappedFetch<{}>(`/topics/${topicId}`, { method: 'GET' });
}

export const fetchThreads = async (topicId: string) => {
    return wrappedFetch<{}[]>(`/topics/${topicId}/threads/`, { method: 'GET' });
}

export const fetchThread = async (topicId: string, threadId: string) => {
    return wrappedFetch<{}>(`/topics/${topicId}/threads/${threadId}`, { method: 'GET' });
}

export const sendThreadChat = async (topicId: string, threadId: string, message: string) => {
    return wrappedFetch<{}>(`/topics/${topicId}/threads/${threadId}/chat`,
        {
            method: 'POST', body: JSON.stringify({ message })
        });
}

export const fetchFiles = async (topicId: string) => {
    return wrappedFetch<{}[]>(`/topics/${topicId}/files/`, { method: 'GET' });
}

export const fetchFile = async (topicId: string, fileId: string) => {
    return wrappedFetch<{}>(`/topics/${topicId}/files/${fileId}`, { method: 'GET' });
}

export const createTopic = async (body: { name: string; description: string }) => {
    return wrappedFetch<{}>('/topics/', { method: 'POST', body: JSON.stringify(body) });
}

export const createThread = async (topicId: string, body: { name: string; description: string }) => {
    return wrappedFetch<{id:string}>(`/topics/${topicId}/threads/`,
        { method: 'POST', body: JSON.stringify(body) }
    );
}

export const deleteThread = async (topicId: string, threadId: string) => {
    return wrappedFetch<{}>(`/topics/${topicId}/threads/${threadId}`, { method: 'DELETE' });
}

export const createFile = async (topicId: string, filename: string, data:ArrayBuffer)=> {
    const body = new Blob([data], { type: 'application/octet-stream' });
    return wrappedFetch<{}>(`/topics/${topicId}/files/`, {
        method: 'POST',
        body,
        headers: { 
            'Content-Type': 'application/octet-stream', 
            filename, 
            'Content-Disposition': `attachment; filename="${filename}"`,
        }
    });

}

export const createUser = async (body: { name: string; email: string }) => {
    return wrappedFetch<{userId:string}>('/users/', { method: 'POST', body: JSON.stringify(body) });
}