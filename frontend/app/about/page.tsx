import { Navbar } from "@/components/Navbar";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-12">
                <h1 className="text-4xl font-bold text-udsm-blue mb-6">About the Portal</h1>

                <div className="bg-white p-8 rounded-xl shadow-sm space-y-6 text-gray-700 leading-relaxed">
                    <p className="text-lg font-medium text-gray-900">
                        The University of Dar es Salaam (UDSM) Journal Visibility Portal is a centralized platform designed to showcase the breadth and impact of research produced by our scholarly community.
                    </p>

                    <p>
                        Our mission is to increase the global reach of UDSM research by providing a modern, accessible, and data-driven interface for our journals. By aggregating data from across our diverse publications, we provide real-time insights into who is reading our work and where.
                    </p>

                    <h2 className="text-2xl font-bold text-udsm-blue mt-8">Key Objectives</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>**Global Visibility**: Ensuring UDSM research is discoverable and accessible to a worldwide audience.</li>
                        <li>**Impact Tracking**: Providing real-time analytics on downloads, citations, and readership diversity.</li>
                        <li>**Open Access**: Supporting the free exchange of knowledge to drive innovation and development.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-udsm-blue mt-8">Contact Us</h2>
                    <p>
                        For inquiries regarding journal submissions or technical support, please contact the Directorate of Research and Publication at <a href="mailto:research@udsm.ac.tz" className="text-udsm-gold hover:underline font-bold">research@udsm.ac.tz</a>.
                    </p>
                </div>
            </div>
        </div>
    );
}
