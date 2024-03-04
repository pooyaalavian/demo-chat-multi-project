import { SearchResult } from "./search";

export interface HumanMessage {
    role: 'user';
    agent: 'human';
    userId: string;
    name: string;
    content: string;
}

export interface SearchUserMessage {
    role: 'user';
    agent: 'search-assistant';
    input: string;
    search_type: string;
    results: SearchResult[];
}

export interface AiAssistantMessage {
    role: 'assistant';
    content: string;
    metadata: unknown;
}

export type AnyMessage = HumanMessage | SearchUserMessage | AiAssistantMessage;

export interface Thread {
    id: string;
    type: 'thread';
    topicId: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    messages: AnyMessage[];
}