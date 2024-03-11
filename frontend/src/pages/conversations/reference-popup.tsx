import { SyntheticEvent, useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {ChevronLeftIcon, ChevronRightIcon, ChromeCloseIcon} from '@fluentui/react-icons-mdl2';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
).toString();


export const ReferencePopup = ({ path, page, onClose }: { path: string; page: string; onClose: () => void }) => {
    const [numPages, setNumPages] = useState<number>();
    const [pageNumber, setPageNumber] = useState<number>(parseInt(page));

    
    function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
        setNumPages(numPages);
    }
    const _onClose = (e: SyntheticEvent) => {
        console.log('here');
        e.preventDefault();
        e.stopPropagation();
        onClose();
    }
    function changePage(offset: number) {
        setPageNumber(prevPageNumber => prevPageNumber + offset);
    }
    useEffect(() => {
        const handleEscKey = (event:KeyboardEvent) => { if(event.keyCode === 27) { onClose(); }};
        document.addEventListener('keydown', handleEscKey);
        return () => document.removeEventListener('keydown', handleEscKey);
    },[onClose]);

    return (
        <div className='fixed top-0 left-0 w-full h-full  backdrop-blur-sm' onClick={_onClose}>
            <div className="h-full flex items-center justify-center w-full" onClick={(e) => e.stopPropagation()}>
                <div className="pdf-container bg-white border border-gray-500 overflow-auto relative">
                    {/* <button onClick={e => _onClose(e)}>Close</button> */}
                    <Document file={path} onLoadSuccess={onDocumentLoadSuccess}>
                        <Page pageNumber={pageNumber} renderTextLayer={false} renderAnnotationLayer={false} />
                    </Document>
                    <div className="absolute top-1 right-1">
                        <button onClick={_onClose}
                        className="border border-gray-300 bg-gray-100 cursor-pointer h-8 w-8 flex items-center justify-center">
                            <ChromeCloseIcon/>
                            </button>
                    </div>
                    <div className='absolute bottom-2 w-full'>
                        <div className="flex w-full items-center justify-center flex-row">
                            <div className="flex-1"></div>
                            <div className="flex-0">
                                <div className="border border-gray-300 bg-gray-100 m-auto relative shadow-lg flex">
                                    <button className='p-2 pt-1 hover:bg-white cursor-pointer' type="button" disabled={pageNumber <= 1} onClick={()=>changePage(-1)}>
                                        <ChevronLeftIcon/>
                                    </button>
                                    <div className='p-2 border-r border-l border-gray-300'>
                                        Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
                                    </div>
                                    <button className='p-2 pt-1 hover:bg-white cursor-pointer' type="button" disabled={pageNumber >= (numPages || 0)} onClick={()=>changePage(1)}>
                                        <ChevronRightIcon/>
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1"></div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};