"use client";

import { FileText, Download, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface PDFViewerProps {
    articleId: string | number;
    articleTitle: string;
}

export function PDFViewer({ articleId, articleTitle }: PDFViewerProps) {
    const [pdfError, setPdfError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const pdfUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/articles/${articleId}/pdf`;
    const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/articles/${articleId}/pdf/download`;

    const handleDownload = async () => {
        try {
            const response = await fetch(downloadUrl);
            if (!response.ok) {
                setPdfError(true);
                return;
            }

            // Create blob and download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${articleTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download failed:', error);
            setPdfError(true);
        }
    };

    // Pre-flight check to see if PDF actually exists before showing iframe
    const checkPdfExists = async () => {
        try {
            const response = await fetch(pdfUrl, { method: 'HEAD' });
            if (!response.ok) {
                setPdfError(true);
            }
        } catch (error) {
            setPdfError(true);
        } finally {
            setIsLoading(false);
        }
    };

    // Use effect to run check on mount
    useEffect(() => {
        checkPdfExists();
    }, [pdfUrl]);

    const handleIframeLoad = () => {
        setIsLoading(false);
    };

    const handleIframeError = () => {
        setIsLoading(false);
        setPdfError(true);
    };

    if (pdfError) {
        return (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
                <AlertCircle className="mx-auto mb-4 text-gray-300" size={64} />
                <h3 className="text-xl font-bold text-gray-800 mb-2 font-serif">Full-text Not Available</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                    This article version has been migrated, but the physical PDF file is still being processed or was not provided in the original export.
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-udsm-blue font-bold px-4 py-2 bg-udsm-blue/5 rounded-full">
                    <FileText size={16} /> Version check complete
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Download Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 bg-udsm-blue text-white px-4 py-2 rounded hover:bg-blue-800 transition-colors"
                >
                    <Download size={16} />
                    Download PDF
                </button>
            </div>

            {/* PDF Viewer */}
            <div className="relative w-full h-[800px] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white">
                        <div className="text-center">
                            <FileText className="mx-auto mb-2 animate-pulse text-udsm-blue" size={48} />
                            <p className="text-sm text-gray-600">Loading PDF...</p>
                        </div>
                    </div>
                )}

                <iframe
                    src={pdfUrl}
                    className="w-full h-full"
                    title={articleTitle}
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                />
            </div>
        </div>
    );
}
