import React, { useState } from 'react';
import { Course } from '../../types';
import { X, Send } from 'lucide-react';
import { PaystackButtonWrapper } from './PaystackButtonWrapper';
import { useAuth } from '../../store/AuthContext';
import { FileUpload } from './FileUpload';

export const EnrollmentModal = ({ course, onClose, onEnroll }: { course: Course, onClose: () => void, onEnroll: (paymentMethod: 'one-time' | 'installment', reqUrl?: string) => void }) => {
    const { currentUser } = useAuth();
    const [paymentMethod, setPaymentMethod] = useState<'one-time' | 'installment'>('one-time');
    const [reqUrl, setReqUrl] = useState<string>('');
    const [loading, setLoading] = useState(false);

    if (!currentUser) return null;

    const requiresPayment = course.price > 0;
    const installmentPrice = requiresPayment ? Math.ceil(course.price / 3) : 0; // simplistic calculation

    const handleSuccess = () => {
        setLoading(true);
        onEnroll(paymentMethod, reqUrl);
    };

    const handleFreeEnroll = () => {
        setLoading(true);
        onEnroll('one-time', reqUrl);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-800">
                    <h3 className="text-xl font-bold text-white">Enroll in {course.title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {course.requirements && (
                        <div className="space-y-2">
                            <h4 className="font-bold text-white">Course Requirements</h4>
                            <p className="text-sm text-slate-400">{course.requirements}</p>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-slate-300 mb-2">Upload Required Documents</label>
                                <FileUpload label="Attach File/Document" onUpload={url => setReqUrl(url)} />
                                {reqUrl && <p className="text-emerald-400 text-xs mt-2">Document uploaded successfully.</p>}
                            </div>
                        </div>
                    )}

                    {requiresPayment && (
                        <div className="space-y-4 pt-4 border-t border-slate-800">
                            <h4 className="font-bold text-white">Payment Options</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setPaymentMethod('one-time')}
                                    className={`p-4 rounded-xl border text-left transition-colors ${paymentMethod === 'one-time' ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}
                                >
                                    <div className="font-bold text-white mb-1">Pay in Full</div>
                                    <div className="text-lg font-black text-indigo-400">{course.currency} {course.price}</div>
                                </button>
                                <button 
                                    onClick={() => setPaymentMethod('installment')}
                                    className={`p-4 rounded-xl border text-left transition-colors ${paymentMethod === 'installment' ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}
                                >
                                    <div className="font-bold text-white mb-1">3 Installments</div>
                                    <div className="text-lg font-black text-indigo-400">{course.currency} {installmentPrice} <span className="text-xs text-slate-400 font-normal">/mo</span></div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-800">
                    {requiresPayment ? (
                        <PaystackButtonWrapper 
                            email={currentUser.email}
                            amount={paymentMethod === 'one-time' ? course.price : installmentPrice}
                            currency={course.currency}
                            label={`Pay ${course.currency} ${paymentMethod === 'one-time' ? course.price : installmentPrice}`}
                            onSuccess={handleSuccess}
                            disabled={loading || (!!course.requirements && !reqUrl)}
                        />
                    ) : (
                        <button 
                            onClick={handleFreeEnroll}
                            disabled={loading || (!!course.requirements && !reqUrl)}
                            className="w-full justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold transition flex items-center"
                        >
                            {loading ? 'Processing...' : 'Complete Enrollment'} <Send className="w-5 h-5 ml-2" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
