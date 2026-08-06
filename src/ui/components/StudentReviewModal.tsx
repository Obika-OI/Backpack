import React from 'react';
import { EnrollmentRequest, Course } from '../../types';
import { X, CheckCircle, XCircle, FileText, User, CreditCard, ShieldCheck, DollarSign } from 'lucide-react';

interface StudentReviewModalProps {
    request: EnrollmentRequest | null;
    course: Course | undefined;
    onClose: () => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

export const StudentReviewModal: React.FC<StudentReviewModalProps> = ({
    request,
    course,
    onClose,
    onApprove,
    onReject,
}) => {
    if (!request) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 my-8">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 transition"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xl">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Review Student Enrollment Application</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Review student documents and payment terms before accepting.</p>
                    </div>
                </div>

                <div className="space-y-6 text-sm">
                    {/* Student Info */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <span className="text-xs text-slate-400 font-semibold uppercase block">Student Name</span>
                            <span className="font-bold text-slate-900 dark:text-white text-base">{request.userName}</span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 font-semibold uppercase block">Status</span>
                            <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
                                request.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                request.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                                'bg-red-500/20 text-red-400'
                            }`}>
                                {request.status.toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 font-semibold uppercase block">Course Applied</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{request.courseTitle}</span>
                        </div>
                        <div>
                            <span className="text-xs text-slate-400 font-semibold uppercase block">Payment Method</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200 capitalize flex items-center mt-0.5">
                                <CreditCard className="w-4 h-4 mr-1 text-indigo-400" />
                                {request.paymentMethod === 'installment' ? 'Installment Plan' : 'Paid in Full'}
                            </span>
                        </div>
                    </div>

                    {/* Course Pricing Details */}
                    {course && (
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <DollarSign className="w-5 h-5 text-indigo-500" />
                                <div>
                                    <span className="font-bold text-slate-900 dark:text-white block">Course Fee</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {course.currency || 'NGN'} {course.price.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-indigo-400 font-semibold block">Allowed Terms</span>
                                <span className="text-xs text-slate-600 dark:text-slate-300 capitalize">
                                    {course.paymentTermsAllowed === 'both' ? 'Full & Installments' : course.paymentTermsAllowed}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Submitted Documents */}
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-indigo-400" /> Submitted Documents & Proofs
                        </h3>
                        {request.documents && Object.keys(request.documents).length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.entries(request.documents).map(([docName, url]) => (
                                    <div key={docName} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                        <div className="truncate mr-2">
                                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{docName}</p>
                                            <span className="text-[10px] text-slate-400 uppercase">Document Attachment</span>
                                        </div>
                                        <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-bold rounded-lg transition shrink-0"
                                        >
                                            View
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-slate-500 text-xs italic">
                                No required document attachments submitted for this request.
                            </div>
                        )}
                    </div>

                    {/* Admission Requirements */}
                    {course?.requirements && (
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center">
                                <ShieldCheck className="w-4 h-4 mr-2 text-emerald-400" /> Course Admission Requirements
                            </h3>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                                {course.requirements}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs transition"
                    >
                        Close
                    </button>
                    {request.status === 'pending' && (
                        <>
                            <button
                                onClick={() => { onReject(request.id); onClose(); }}
                                className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-semibold text-xs transition flex items-center"
                            >
                                <XCircle className="w-4 h-4 mr-1.5" /> Reject Student
                            </button>
                            <button
                                onClick={() => { onApprove(request.id); onClose(); }}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs transition flex items-center shadow-md shadow-emerald-600/20"
                            >
                                <CheckCircle className="w-4 h-4 mr-1.5" /> Approve & Enroll
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
