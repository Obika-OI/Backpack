import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useAppContext } from '../../store/AppContext';
import { ShieldCheck, User, Building, Send, AlertTriangle } from 'lucide-react';
import { FileUpload } from '../components/FileUpload';

export const Settings = () => {
    const { currentUser, updateCurrentUser } = useAuth();
    const { organizations, updateOrganization } = useAppContext();
    const [loading, setLoading] = useState(false);
    
    const [userKycDoc, setUserKycDoc] = useState(currentUser?.kycDocumentUrl || '');
    
    // If user is org owner, they can update org KYC
    const ownedOrg = organizations.find(o => o.ownerId === currentUser?.id);
    const [orgKycDoc, setOrgKycDoc] = useState(ownedOrg?.kycDocumentUrl || '');
    
    const handleSaveUserKyc = async () => {
        setLoading(true);
        await updateCurrentUser({ 
            kycDocumentUrl: userKycDoc,
            kycVerified: true // for demo purposes we auto verify
        });
        setLoading(false);
        alert('Identity verification details updated successfully.');
    };

    const handleSaveOrgKyc = async () => {
        if (!ownedOrg) return;
        setLoading(true);
        await updateOrganization(ownedOrg.id, {
            kycDocumentUrl: orgKycDoc,
            kycVerified: true // auto verify for demo
        });
        setLoading(false);
        alert('Organization registration details updated successfully.');
    };

    if (!currentUser) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-12">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Account Settings</h1>
                <p className="text-slate-400 mt-2">Manage your profile and verification details.</p>
            </div>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex items-center">
                    <User className="w-6 h-6 text-indigo-400 mr-3" />
                    <h2 className="text-xl font-bold text-white">Personal Identity Verification (KYC)</h2>
                </div>
                <div className="p-6 space-y-6">
                    {currentUser.kycVerified ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center">
                            <ShieldCheck className="w-6 h-6 text-emerald-400 mr-3" />
                            <div>
                                <h3 className="font-bold text-emerald-400">Identity Verified</h3>
                                <p className="text-sm text-emerald-500/80">Your identity documents have been verified.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center">
                            <AlertTriangle className="w-6 h-6 text-amber-400 mr-3" />
                            <div>
                                <h3 className="font-bold text-amber-400">Verification Pending</h3>
                                <p className="text-sm text-amber-500/80">Please upload a valid government-issued ID to verify your identity.</p>
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Upload Government ID (Passport, Driver's License)</label>
                        <FileUpload label="Upload ID Document" onUpload={(url) => setUserKycDoc(url)} />
                        {userKycDoc && <div className="mt-2 text-sm text-emerald-400 font-medium">Document uploaded.</div>}
                    </div>

                    <button 
                        onClick={handleSaveUserKyc}
                        disabled={loading || !userKycDoc}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold transition flex items-center"
                    >
                        {loading ? 'Saving...' : 'Submit Identity Document'} <Send className="w-4 h-4 ml-2" />
                    </button>
                </div>
            </div>

            {ownedOrg && (
                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-700 flex items-center">
                        <Building className="w-6 h-6 text-emerald-400 mr-3" />
                        <h2 className="text-xl font-bold text-white">Organization Verification (KYB)</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        {ownedOrg.kycVerified ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center">
                                <ShieldCheck className="w-6 h-6 text-emerald-400 mr-3" />
                                <div>
                                    <h3 className="font-bold text-emerald-400">Organization Verified</h3>
                                    <p className="text-sm text-emerald-500/80">Your company registration has been verified.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center">
                                <AlertTriangle className="w-6 h-6 text-amber-400 mr-3" />
                                <div>
                                    <h3 className="font-bold text-amber-400">Verification Pending</h3>
                                    <p className="text-sm text-amber-500/80">Please upload your official business registration certificate to verify authenticity.</p>
                                </div>
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Upload Registration Certificate</label>
                            <FileUpload label="Upload Certificate" onUpload={(url) => setOrgKycDoc(url)} />
                            {orgKycDoc && <div className="mt-2 text-sm text-emerald-400 font-medium">Document uploaded.</div>}
                        </div>

                        <button 
                            onClick={handleSaveOrgKyc}
                            disabled={loading || !orgKycDoc}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold transition flex items-center"
                        >
                            {loading ? 'Saving...' : 'Submit Registration Document'} <Send className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
