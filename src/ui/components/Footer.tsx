
import React from 'react';
import { Link } from 'react-router-dom';
import { Backpack } from 'lucide-react'; // Replace with 'next/link' if using Next.js
import { ArrowRight, Globe, Github, Twitter, Linkedin, Heart } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">

                {/* Top Grid: Brand & Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">

                    {/* Brand Column */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-sm">
                            <Backpack className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span>Backpack LMS</span>
                        </div>

                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Education, <span className="text-indigo-600 dark:text-indigo-400">Without Borders.</span>
                        </h2>

                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm">
                            Empowering pan-African educational organizations with seamless course delivery, student tracking, and multi-currency payments.
                        </p>

                        {/* Language / Region Indicator */}
                        <div className="inline-flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 pt-2">
                            <Globe className="w-4 h-4 text-indigo-500" />
                            <span>Supporting 15+ African Regional Currencies</span>
                        </div>
                    </div>

                    {/* Quick Links Columns */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Platform
                        </h3>
                        <ul className="space-y-2 text-sm">
                            {['Explore Courses', 'For Institutions', 'Regional Payments', 'Pricing', 'Student Portal'].map((item) => (
                                <li key={item}>
                                    <Link
                                        to="#"
                                        className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Resources
                        </h3>
                        <ul className="space-y-2 text-sm">
                            {['Documentation', 'API Reference', 'Case Studies', 'Partner Network', 'Community'].map((item) => (
                                <li key={item}>
                                    <Link
                                        to="#"
                                        className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Company
                        </h3>
                        <ul className="space-y-2 text-sm">
                            {['About Us', 'Careers', 'Impact Report', 'Privacy Policy', 'Terms of Service'].map((item) => (
                                <li key={item}>
                                    <Link
                                        to="#"
                                        className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>

                {/* Newsletter CTA Banner */}
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 mb-12 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                            Stay updated on Pan-African educational tech
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Get monthly updates on new features, partners, and regional payment integrations.
                        </p>
                    </div>
                    <div className="flex items-center w-full md:w-auto gap-2">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="w-full md:w-64 px-4 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm shrink-0 flex items-center">
                            Subscribe <ArrowRight className="w-4 h-4 ml-1.5" />
                        </button>
                    </div>
                </div>

                {/* Bottom Bar: Copyright & Socials */}
                <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <p className="flex items-center gap-1">
                        © {new Date().getFullYear()} Backpack Education Inc. Built with <Heart className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" /> for Africa.
                    </p>

                    <div className="flex items-center space-x-4">
                        <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            <Twitter className="w-4 h-4" />
                        </a>
                        <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            <Linkedin className="w-4 h-4" />
                        </a>
                        <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            <Github className="w-4 h-4" />
                        </a>
                    </div>
                </div>

            </div>
        </footer>
    );
};

export default Footer