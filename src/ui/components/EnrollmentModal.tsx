import React, { useState } from 'react';
import { Course } from '../../types';
import { X, Send, CheckCircle, FileText, Award, ShieldCheck, Plus, Trash2, Paperclip, MessageSquare, AlertCircle } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { FileUpload } from './FileUpload';
import { generateId } from '../../lib/id';

interface AdditionalDoc {
    id: string;
    name: string;
    url: string;
}

interface EnrollmentModalProps {
    course: Course;
    onClose: () => void;
    onEnroll: (
        paymentMethod: 'one-time' | 'installment',
        documents?: Record<string, string>,
        additionalDocs?: Array<{ id: string; name: string; url: string }>,
        studentNotes?: string,
        sessionId?: string,
        sessionName?: string
    ) => void;
    isReapplication?: boolean;
    previousRequest?: EnrollmentRequest | null;
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({
    course,
    onClose,
    onEnroll,
    isReapplication = false,
    previousRequest = null,
}) => {
    const { currentUser } = useAuth();
    const activeSessionName = course.activeSessionName || (course.admissionSessions && course.admissionSessions.find(s => s.status === 'open')?.name) || 'Current Session';
    const activeSessionId = course.activeSessionId || (course.admissionSessions && course.admissionSessions.find(s => s.status === 'open')?.id);

    const [paymentMethod, setPaymentMethod] = useState<'one-time' | 'installment'>(
        previousRequest?.paymentMethod || (course.paymentTermsAllowed === 'installment' ? 'installment' : 'one-time')
    );
    const [documents, setDocuments] = useState<Record<string, string>>(
        previousRequest?.documents || {}
    );
    const [additionalDocs, setAdditionalDocs] = useState<AdditionalDoc[]>(
        previousRequest?.additionalDocuments || []
    );
    const [newDocName, setNewDocName] = useState('');
    const [newDocUrl, setNewDocUrl] = useState('');
    const [studentNotes, setStudentNotes] = useState(
        previousRequest?.studentNotes || ''
    );
    const [loading, setLoading] = useState(false);

    if (!currentUser) return null;

    const requiresPayment = course.price > 0;
    const installmentPrice = requiresPayment ? Math.ceil(course.price / 3) : 0;

    // Standard default document list if course doesn't specify any
    const effectiveRequiredDocs = course.requiredDocuments && course.requiredDocuments.length > 0
        ? course.requiredDocuments
        : ['Identification Document (ID/Passport)', 'Academic Transcript / Certificate', 'Curriculum Vitae (CV)'];

    const missingDocs = course.requiredDocuments && course.requiredDocuments.length > 0
        ? course.requiredDocuments.some(doc => !documents[doc])
        : false;

    const handleSubmitApplication = () => {
        setLoading(true);
        onEnroll(paymentMethod, documents, additionalDocs, studentNotes, activeSessionId, activeSessionName);
    };

    const attachProfileCv = (docName: string) => {
        if (currentUser.cvUrl) {
            setDocuments(prev => ({ ...prev, [docName]: currentUser.cvUrl! }));
        }
    };

    const attachSavedDoc = (docName: string, url: string) => {
        setDocuments(prev => ({ ...prev, [docName]: url }));
    };

    const handleAddCustomDoc = () => {
        if (!newDocName.trim() || !newDocUrl.trim()) return;
        setAdditionalDocs(prev => [
            ...prev,
            { id: generateId('doc'), name: newDocName.trim(), url: newDocUrl.trim() }
        ]);
        setNewDocName('');
        setNewDocUrl('');
    };

    const handleRemoveCustomDoc = (id: string) => {
        setAdditionalDocs(prev => prev.filter(d => d.id !== id));
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div>
                        <div className="flex items-center space-x-2 mb-1">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                Intake: {activeSessionName}
                            </span>
                            {isReapplication && (
                                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">
                                    Reapplication
                                </span>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            {isReapplication ? `Reapply for ${course.title}` : `Apply for ${course.title}`}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {isReapplication
                                ? `Submitting a new admission application for ${activeSessionName}. You can update your attachments and statement below.`
                                : 'Submit your required documents and application for review by the organization.'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Reapplication Banner */}
                    {isReapplication && (
                        <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl text-xs text-indigo-900 dark:text-indigo-200 flex items-start space-x-3">
                            <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold block text-indigo-900 dark:text-indigo-200">
                                    Eligible for Reapplication in Next Admission Session
                                </span>
                                Admissions are open for <span className="font-semibold">{activeSessionName}</span>. Your previous documents have been preserved for convenience — feel free to upload refreshed credentials or write an updated statement.
                            </div>
                        </div>
                    )}

                    {/* Notice box */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-3">
                        <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold block text-slate-900 dark:text-white">Application Review & Admission Process</span>
                            No tuition fee is charged now. The admissions team at the partner organization will evaluate your submitted documents for <span className="font-medium text-indigo-600 dark:text-indigo-400">{activeSessionName}</span> and approve your enrollment.
                        </div>
                    </div>

                    {/* Admission Guidelines */}
                    {course.requirements && (
                        <div className="space-y-2 p-4 bg-white dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                Admission Guidelines & Criteria
                            </h4>
                            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-5">
                                {course.requirements.split('\n').filter(Boolean).map((req, idx) => (
                                    <li key={idx}>{req.replace(/^•\s*/, '')}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Required Documents Section */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center">
                                    <Paperclip className="w-4 h-4 text-indigo-500 mr-2" />
                                    Application Documents
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Upload official documents for the organization's review board.
                                </p>
                            </div>
                        </div>

                        {effectiveRequiredDocs.map(docName => {
                            const isAttached = !!documents[docName];
                            return (
                                <div key={docName} className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center">
                                            <span>{docName}</span>
                                            {course.requiredDocuments?.includes(docName) && (
                                                <span className="text-red-500 ml-1 text-xs">*</span>
                                            )}
                                        </label>
                                        {isAttached ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                                <CheckCircle className="w-3 h-3 mr-1" /> Document Attached
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-[10px]">
                                                {course.requiredDocuments?.includes(docName) ? 'Required' : 'Optional'}
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
                                                className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-medium rounded-lg hover:bg-amber-100 transition flex items-center"
                                            >
                                                <Award className="w-3 h-3 mr-1" /> Use "{saved.title}"
                                            </button>
                                        ))}
                                    </div>

                                    <FileUpload
                                        label={`Upload file for ${docName}`}
                                        onUpload={url => setDocuments(prev => ({ ...prev, [docName]: url }))}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* Additional Custom Supporting Documents */}
                    <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center">
                                <Plus className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                                Add Other Supporting Documents (Optional)
                            </h4>
                        </div>

                        {additionalDocs.length > 0 && (
                            <div className="space-y-2">
                                {additionalDocs.map(doc => (
                                    <div key={doc.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                                        <div className="flex items-center space-x-2 truncate">
                                            <Paperclip className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                            <span className="font-semibold text-slate-900 dark:text-white truncate">{doc.name}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCustomDoc(doc.id)}
                                            className="p-1 text-slate-400 hover:text-red-500 transition"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-2 pt-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    placeholder="Document Title (e.g. Portfolio)"
                                    value={newDocName}
                                    onChange={e => setNewDocName(e.target.value)}
                                    className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <input
                                    type="text"
                                    placeholder="File URL / Google Drive link"
                                    value={newDocUrl}
                                    onChange={e => setNewDocUrl(e.target.value)}
                                    className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <FileUpload
                                    label="Or upload custom file"
                                    onUpload={url => setNewDocUrl(url)}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCustomDoc}
                                    disabled={!newDocName.trim() || !newDocUrl.trim()}
                                    className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white disabled:opacity-40 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg transition"
                                >
                                    Add Document
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Student Statement / Notes to Admissions */}
                    <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                        <label className="font-bold text-xs text-slate-900 dark:text-white flex items-center">
                            <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                            Statement of Purpose / Notes for Reviewer
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Briefly state your background, qualifications, or reasons for applying to this course..."
                            value={studentNotes}
                            onChange={e => setStudentNotes(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Tuition Payment Preference */}
                    {requiresPayment && (
                        <div className="space-y-3 pt-2">
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                    Preferred Tuition Plan (Due upon Acceptance)
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Select how you plan to pay tuition once approved.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {(course.paymentTermsAllowed === 'one-time' || course.paymentTermsAllowed === 'both' || !course.paymentTermsAllowed) && (
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('one-time')}
                                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                                            paymentMethod === 'one-time'
                                                ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/20'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        <div className="font-bold text-slate-900 dark:text-white text-xs mb-0.5">Pay in Full</div>
                                        <div className="text-base font-black text-indigo-600 dark:text-indigo-400">
                                            {course.currency} {course.price.toLocaleString()}
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-1">One-time payment upon acceptance</div>
                                    </button>
                                )}

                                {(course.paymentTermsAllowed === 'installment' || course.paymentTermsAllowed === 'both' || !course.paymentTermsAllowed) && (
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('installment')}
                                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                                            paymentMethod === 'installment'
                                                ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/20'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        <div className="font-bold text-slate-900 dark:text-white text-xs mb-0.5">Flexible Installments</div>
                                        <div className="text-base font-black text-indigo-600 dark:text-indigo-400">
                                            {course.currency} {installmentPrice.toLocaleString()}{' '}
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                                                /{course.installmentInterval === 'weekly' ? 'wk' : 'mo'}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-1">Split tuition upon acceptance</div>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {missingDocs && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>Please attach all mandatory documents marked with an asterisk (*) to submit.</span>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-3 px-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl text-xs transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmitApplication}
                        disabled={loading || missingDocs}
                        className="flex-1 py-3 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/25 text-xs sm:text-sm"
                    >
                        {loading ? <span>Submitting Application...</span> : (
                            <>
                                <span>Submit Application for Review</span>
                                <Send className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
