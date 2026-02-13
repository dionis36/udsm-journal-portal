import { Navbar } from "@/components/Navbar";

export default function AccessibilityPage() {
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-12">
                <h1 className="text-4xl font-bold text-udsm-blue mb-6">Accessibility Statement</h1>

                <div className="bg-white p-8 rounded-xl shadow-sm space-y-6 text-gray-700">
                    <p>
                        The University of Dar es Salaam is committed to making its digital platforms accessible to all users, regardless of disability or technology. We strive to adhere to the **Web Content Accessibility Guidelines (WCAG) 2.1** at the AA level.
                    </p>

                    <h2 className="text-2xl font-bold text-udsm-blue mt-4">Measures Taken</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>**Semantic HTML**: We use standard HTML5 elements to ensure compatibility with screen readers.</li>
                        <li>**Keyboard Navigation**: All interactive elements are accessible via keyboard tab order.</li>
                        <li>**Color Contrast**: We utilize the official UDSM high-contrast palette (Navy Blue and Gold) to ensure text is readable.</li>
                        <li>**Alt Text**: All distinct images include descriptive alternative text.</li>
                        <li>**Responsive Design**: The site is fully functional at up to 200% zoom and on mobile devices.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-udsm-blue mt-4">Feedback</h2>
                    <p>
                        We welcome your feedback on the accessibility of the UDSM Journal Portal. If you encounter accessibility barriers, please contact us:
                    </p>
                    <p className="font-medium">
                        Email: <a href="mailto:webmaster@udsm.ac.tz" className="text-udsm-blue hover:underline">webmaster@udsm.ac.tz</a><br />
                        Phone: +255 22 2410 500
                    </p>
                </div>
            </div>
        </div>
    );
}
