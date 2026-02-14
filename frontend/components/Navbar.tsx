import Link from "next/link";
import { Search, Menu, Globe } from "lucide-react";

export function Navbar() {
    return (
        <nav className="bg-udsm-blue text-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-1 rounded-full">
                            {/* Placeholder for UDSM Logo - using Globe for now */}
                            <Globe className="h-8 w-8 text-udsm-blue" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg tracking-wide">UDSM</span>
                            <span className="text-xs text-udsm-gold uppercase tracking-wider">Journal Visibility Portal</span>
                        </div>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-center space-x-6">
                            <Link href="/" className="hover:text-udsm-gold px-2 py-2 text-sm font-bold uppercase tracking-tight transition-colors">
                                Home
                            </Link>
                            <Link href="/journals/tjpsd" className="hover:text-udsm-gold px-2 py-2 text-sm font-bold uppercase tracking-tight transition-colors">
                                Current
                            </Link>
                            <Link href="/archives" className="hover:text-udsm-gold px-2 py-2 text-sm font-bold uppercase tracking-tight transition-colors">
                                Archives
                            </Link>

                            {/* About Dropdown */}
                            <div className="relative group">
                                <button className="hover:text-udsm-gold px-2 py-2 text-sm font-bold uppercase tracking-tight transition-colors flex items-center gap-1">
                                    About
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                <div className="absolute left-0 mt-0 w-56 bg-white rounded-lg shadow-xl py-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 transform origin-top scale-95 group-hover:scale-100 z-50 border border-gray-100">
                                    <Link href="/about" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-udsm-blue/5 hover:text-udsm-blue font-medium transition-colors">
                                        About the Journal
                                    </Link>
                                    <Link href="/about/submissions" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-udsm-blue/5 hover:text-udsm-blue font-medium transition-colors">
                                        Submissions
                                    </Link>
                                    <Link href="/about/privacy" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-udsm-blue/5 hover:text-udsm-blue font-medium transition-colors">
                                        Privacy Statement
                                    </Link>
                                    <Link href="/about/contact" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-udsm-blue/5 hover:text-udsm-blue font-medium transition-colors">
                                        Contact
                                    </Link>
                                </div>
                            </div>

                            <Link href="/search" className="hover:text-udsm-gold px-2 py-2 text-sm font-bold uppercase tracking-tight transition-colors">
                                Search
                            </Link>
                        </div>
                    </div>

                    {/* Search & Mobile Menu */}
                    <div className="flex items-center gap-4">
                        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <Search className="h-5 w-5" />
                        </button>
                        <button className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors">
                            <Menu className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
