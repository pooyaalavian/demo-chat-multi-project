import { SearchResult } from "./search";

export interface HumanMessage {
    role: 'user';
    agent: 'human';
    userId: string;
    name: string;
    content: string;
    timestamp: string;
}

export interface SearchUserMessage {
    role: 'user';
    agent: 'search-assistant';
    input: string;
    search_type: string;
    results: SearchResult[];
    timestamp: string;
}

export interface AiAssistantMessage {
    role: 'assistant';
    content: string;
    metadata: unknown;
    timestamp: string;
}

export type AnyMessage = HumanMessage | SearchUserMessage | AiAssistantMessage;

export interface Conversation {
    id: string;
    type: 'conversation';
    topicId: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    messages: AnyMessage[];
    usage?: { type: 'search'|'chat',model:string; prompt_tokens: number; completion_tokens: number; }[];
}