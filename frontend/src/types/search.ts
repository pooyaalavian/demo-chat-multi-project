export interface SearchResult {
    id: string;
    content: string;
    title: string;
    url: string;
    type: 'paragraph' | 'table';
    truncatedStart: boolean;
    truncatedEnd: boolean;
    pageNumber: string;
    metadata: string;
}