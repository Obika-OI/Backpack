import React, { useState } from 'react';
import { Course } from '../../types';
import { X, Send, CheckCircle, FileText, Award, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { FileUpload } from './FileUpload';

export const EnrollmentModal = ({ course, onClose, onEnroll }: { course: Course, onClose: () => void, onEnroll: (paymentMethod: 'one-time' | 'installment', documents?: Record<string, string>) => void }) => {
    const { currentUser } = useAuth();
    const [paymentMethod, setPaymentMethod] = useState<'one-time' | 'installment'>(course.paymentTermsAllowed === 'installment' ? 'installment' : 'one-time');
    const [documents, setDocuments] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    if (!currentUser) return null;

    const requiresPayment = course.price > 0;
    const installmentPrice = requiresPayment ? Math.ceil(course.price / 3) : 0;

    const missingDocs = course.requiredDocuments ? course.requiredDocuments.some(doc => !documents[doc]) : false;

    const handleSubmitApplication = () => {
        setLoading(true);
        onEnroll(paymentMethod, documents);
    };

    // Auto attach profile document if matched
    const attachProfileCv = (docName: string) => {
        if (currentUser.cvUrl) {
            setDocuments(prev => ({ ...prev, [docName]: currentUser.cvUrl! }));
        }
    };

    const attachSavedDoc = (docName: string, url: string) => {
        setDocuments(prev => ({ ...prev, [docName]: url }));
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Apply for {course.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Submit your application documents for course admission.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Notice box */}
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 flex items-start space-x-2.5">
                        <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold block text-indigo-700 dark:text-indigo-300">Application First Workflow</span>
                            No tuition payment is required at this stage. You will only pay AFTER your application is accepted by the institution.
                        </div>
                    </div>

                    {course.requirements && (
                        <div className="space-y-2">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Admission Guidelines & Requirements</h4>
                            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-5">
                                {course.requirements.split('\n').filter(Boolean).map((req, idx) => (
                                    <li key={idx}>{req.replace(/^•\s*/, '')}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {course.requiredDocuments && course.requiredDocuments.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Required Course Documents</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Attach required documents from your saved profile vault or upload a new file.
                            </p>

                            {course.requiredDocuments.map(docName => {
                                const isAttached = !!documents[docName];
                                return (
                                    <div key={docName} className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-900 dark:text-white">{docName}</label>
                                            {isAttached && (
                                                <span className="text-emerald-500 text-[10px] font-bold flex items-center bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Attached
                                                </span>
                                            )}
                                        </div>

                                        {/* Quick attach from profile */}
                                        <div className="flex flex-wrap gap-2 text-[11px]">
                                            {currentUser.cvUrl && (docName.toLowerCase().includes('cv') || docName.toLowerCase().includes('resume')) && (
                                                <button
                                                    type="button"
                                                    onClick={() => attachProfileCv(docName)}
                                                    className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-medium rounded-lg hover:bg-indigo-100 transition flex items-center"
                                                >
                                                    <FileText className="w-3 h-3 mr-1" /> Use Profile CV
                                                </button>
                                            )}

                                            {currentUser.userDocuments && currentUser.userDocuments.map(saved => (
                                                <button
                                                    key={saved.id}
                                                    type="button"
                                                    onClick={() => attachSavedDoc(docName, saved.url)}
                                                    className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-medium rounded-lg hover:bg-amber-100 transition flex items-center"
                                                >
                                                    <Award className="w-3 h-3 mr-1" /> Use "{saved.title}"
                                                </button>
                                            ))}
                                        </div>

                                        <FileUpload 
                                            label={`Upload fresh file for ${docName}`} 
                                            onUpload={url => setDocuments(prev => ({ ...prev, [docName]: url }))} 
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {requiresPayment && (
                        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Preferred Payment Option (If Accepted)</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Select how you prefer to pay once your application is accepted.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(course.paymentTermsAllowed === 'one-time' || course.paymentTermsAllowed === 'both' || !course.paymentTermsAllowed) && (
                                    <button 
                                        type="button"
                                        onClick={() => setPaymentMethod('one-time')}
                                        className={`p-4 rounded-xl border text-left transition-colors ${paymentMethod === 'one-time' ? 'bg-indigo-600/10 border-indigo-500 ring-2 ring-indigo-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                    >
                                        <div className="font-bold text-slate-900 dark:text-white text-xs mb-1">Pay in Full</div>
                                        <div className="text-base font-black text-indigo-500 dark:text-indigo-400">{course.currency} {course.price.toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-500 mt-1">One-time payment upon acceptance</div>
                                    </button>
                                )}

                                {(course.paymentTermsAllowed === 'installment' || course.paymentTermsAllowed === 'both' || !course.paymentTermsAllowed) && (
                                    <button 
                                        type="button"
                                        onClick={() => setPaymentMethod('installment')}
                                        className={`p-4 rounded-xl border text-left transition-colors ${paymentMethod === 'installment' ? 'bg-indigo-600/10 border-indigo-500 ring-2 ring-indigo-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                    >
                                        <div className="font-bold text-slate-900 dark:text-white text-xs mb-1">Flexible Installments</div>
                                        <div className="text-base font-black text-indigo-500 dark:text-indigo-400">{course.currency} {installmentPrice.toLocaleString()} <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">/{course.installmentInterval === 'weekly' ? 'wk' : 'mo'}</span></div>
                                        <div className="text-[10px] text-slate-500 mt-1">Split tuition upon acceptance</div>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                    <button 
                        onClick={handleSubmitApplication}
                        disabled={loading || missingDocs}
                        className="w-full justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center shadow-lg shadow-indigo-600/20 text-sm"
                    >
                        {loading ? 'Submitting Application...' : 'Submit Application (No Payment Now)'} <Send className="w-4 h-4 ml-2" />
                    </button>
                </div>
            </div>
        </div>
    );
};
