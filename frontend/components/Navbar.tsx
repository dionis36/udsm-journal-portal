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
                        <div className="ml-10 flex items-baseline space-x-8">
                            <Link href="/" className="hover:text-udsm-gold px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                Home
                            </Link>
                            <Link href="/journals" className="hover:text-udsm-gold px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                Journals
                            </Link>
                            <Link href="/about" className="hover:text-udsm-gold px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                About
                            </Link>
                            <Link href="/contact" className="hover:text-udsm-gold px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                Contact
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
