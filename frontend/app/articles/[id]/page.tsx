"use client";

import { use } from "react";
import { Navbar } from "@/components/Navbar";
import { PDFViewer } from "@/components/PDFViewer";
import { ArticleMetrics } from "@/components/ArticleMetrics";
import { useArticle } from "@/lib/api";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

export default function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: article, isLoading, isError } = useArticle(id);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-udsm-blue"></div>
            </div>
        );
    }

    if (isError || !article) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-20 text-center">
                    <h1 className="text-4xl font-bold text-gray-800">Article Not Found</h1>
                    <p className="mt-4 text-gray-600">The article you are looking for does not exist or has been removed.</p>
                    <Link href="/journals/tjpsd" className="mt-8 inline-block text-udsm-blue hover:underline">Return to Journal</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Link
                    href="/journals/tjpsd"
                    className="inline-flex items-center gap-2 text-udsm-blue hover:underline mb-6"
                >
                    <ArrowLeft size={16} />
                    Back to Journal
                </Link>

                {/* Article Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 mb-6">
                    <div className="mb-4">
                        <span className="inline-block text-xs font-bold text-white bg-udsm-gold px-3 py-1 rounded uppercase tracking-wider">
                            Research Article
                        </span>
                    </div>

                    <h1 className="text-4xl font-bold text-gray-900 mb-4 font-serif">
                        {article.title}
                    </h1>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
                        <div>
                            <strong className="text-gray-800">Authors:</strong> {Array.isArray(article.authors) ? article.authors.join(", ") : article.authors || "Unknown Author"}
                        </div>
                        {article.doi && (
                            <div>
                                <strong className="text-gray-800">DOI:</strong> {article.doi}
                            </div>
                        )}
                        <div>
                            <strong className="text-gray-800">Published:</strong> {new Date(article.publication_date).toLocaleDateString()}
                        </div>
                    </div>

                    <div className="prose prose-sm max-w-none">
                        <h2 className="text-lg font-bold text-gray-900">Abstract</h2>
                        <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: article.abstract }} />
                    </div>
                </div>

                {/* Article Metrics */}
                <div className="mb-6">
                    <ArticleMetrics articleId={id} />
                </div>

                {/* PDF Viewer */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Download className="text-udsm-gold" />
                        Full Text
                    </h2>

                    <PDFViewer articleId={id} articleTitle={article.title} />
                </div>

                {/* Citation Box */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-6">
                    <h3 className="font-bold text-gray-900 mb-2">How to Cite</h3>
                    <p className="text-sm text-gray-700 font-mono">
                        {Array.isArray(article.authors) ? article.authors.join(", ") : article.authors || "Unknown"} ({new Date(article.publication_date).getFullYear()}). {article.title}.
                        <em> Tanzania Journal for Population Studies and Development</em>. {article.doi && `DOI: ${article.doi}`}
                    </p>
                </div>
            </div>
        </div>
    );
}
