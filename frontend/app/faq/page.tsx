import { Navbar } from "@/components/Navbar";
import { HelpCircle } from "lucide-react";

export default function FAQPage() {
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-12">
                <h1 className="text-4xl font-bold text-udsm-blue mb-6 flex items-center gap-3">
                    <HelpCircle className="text-udsm-gold" size={32} />
                    Frequently Asked Questions
                </h1>

                <div className="space-y-6">
                    <FAQItem
                        question="How do I submit a manuscript?"
                        answer="To submit a manuscript, navigate to the specific journal's homepage and click the 'Submit Research' button. You will be redirected to our Open Journal Systems (OJS) submission portal where you can create an account and upload your work."
                    />
                    <FAQItem
                        question="Are all journals Open Access?"
                        answer="Yes, the University of Dar es Salaam is committed to the principles of Open Access. Most of our journals act under the Creative Commons Attribution License (CC BY), allowing for free and immediate access to research."
                    />
                    <FAQItem
                        question="How is the 'Global Impact' calculated?"
                        answer="Our Global Impact metrics are derived from a combination of real-time download tracking, citation data from Crossref, and diverse readership geolocation analytics. The heatmap represents verified unique institutional and individual access points."
                    />
                    <FAQItem
                        question="Can I access the raw data?"
                        answer=" aggregated datasets are available for research purposes upon request. Please contact the Directorate of Research for data sharing agreements."
                    />
                </div>
            </div>
        </div>
    );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{question}</h3>
            <p className="text-gray-600">{answer}</p>
        </div>
    )
}
