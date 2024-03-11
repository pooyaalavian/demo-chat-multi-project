import { environment } from "../environment";
import { File } from "../types/file";
import { Conversation } from "../types/conversation";
import { Topic } from "../types/topic";
import { acquireTokens } from "./msal";

export const wrappedFetch = async <T>(url: string, options: RequestInit) => {
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
        throw new Error(response.statusText);
    }
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

export const createFile = async (topicId: string, filename: string, data:ArrayBuffer)=> {
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

export const createUser = async (body: { name: string; email: string }) => {
    return wrappedFetch<{userId:string}>('/users/', { method: 'POST', body: JSON.stringify(body) });
}