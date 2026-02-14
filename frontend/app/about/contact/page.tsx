"use client";

import { Navbar } from "@/components/Navbar";
import { Mail, Phone, MapPin, MessageSquare, Clock } from "lucide-react";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="flex flex-col md:flex-row gap-16">
                    <div className="flex-1">
                        <h1 className="text-5xl font-bold text-gray-900 font-serif mb-8">Get in <span className="text-udsm-blue">Touch</span></h1>
                        <p className="text-lg text-gray-600 mb-12 leading-relaxed">
                            Have questions about our archival process or submission guidelines? Our editorial and support teams are here to assist you.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="flex gap-5">
                                <div className="bg-white w-12 h-12 rounded-xl border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
                                    <Mail className="text-udsm-blue" size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-1">Email</h4>
                                    <p className="text-sm text-gray-500">editor.tjpsd@udsm.ac.tz</p>
                                    <p className="text-sm text-gray-500">support.journals@udsm.ac.tz</p>
                                </div>
                            </div>
                            <div className="flex gap-5">
                                <div className="bg-white w-12 h-12 rounded-xl border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
                                    <Phone className="text-udsm-blue" size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-1">Phone</h4>
                                    <p className="text-sm text-gray-500">+255 22 241 0500</p>
                                    <p className="text-sm text-gray-500">Ext: 2167</p>
                                </div>
                            </div>
                            <div className="flex gap-5">
                                <div className="bg-white w-12 h-12 rounded-xl border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
                                    <MapPin className="text-udsm-blue" size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-1">Location</h4>
                                    <p className="text-sm text-gray-500">Main Campus, Mlimani</p>
                                    <p className="text-sm text-gray-500">Dar es Salaam, Tanzania</p>
                                </div>
                            </div>
                            <div className="flex gap-5">
                                <div className="bg-white w-12 h-12 rounded-xl border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
                                    <Clock className="text-udsm-blue" size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-1">Office Hours</h4>
                                    <p className="text-sm text-gray-500">Mon - Fri: 8:00 AM - 4:00 PM</p>
                                    <p className="text-sm text-gray-500">Closed on Holidays</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-[450px]">
                        <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
                            <div className="flex items-center gap-3 mb-8">
                                <MessageSquare className="text-udsm-gold" />
                                <h3 className="text-xl font-bold font-serif">Quick Inquiry</h3>
                            </div>
                            <form className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">FullName</label>
                                    <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-udsm-blue/20 transition-all" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                                    <input type="email" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-udsm-blue/20 transition-all" placeholder="john@example.com" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Message</label>
                                    <textarea rows={4} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-udsm-blue/20 transition-all" placeholder="How can we help?" />
                                </div>
                                <button className="w-full py-4 bg-udsm-blue text-white rounded-xl font-bold hover:bg-udsm-blue focus:ring-4 focus:ring-udsm-blue/30 transition-all shadow-lg">
                                    Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
