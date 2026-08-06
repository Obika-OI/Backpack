import { useState } from "react";
import { useAppContext } from "../../store/AppContext";
import { useAuth } from "../../store/AuthContext";
import { Building, MapPin, DollarSign, ArrowRight, CheckCircle2, Save, FileText } from "lucide-react";
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FileUpload } from '../components/FileUpload';
import { PaystackSubaccountOnboarding } from "../components/PaystackSubaccountOnboarding";

const Onboarding = () => {
    const { addOrganization, updateOrganization, organizations } = useAppContext();
    const { currentUser } = useAuth();
    
    const existingOrg = organizations.find(o => o.ownerId === currentUser?.id);
    
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState(() => ({
        name: existingOrg?.name || "",
        description: existingOrg?.description || "",
        location: existingOrg?.location || "",
        baseCurrency: existingOrg?.baseCurrency || "NGN",
        orgType: (existingOrg?.orgType || "basic") as 'basic' | 'higher' | 'vocational',
        address: existingOrg?.address || "",
        registrationId: existingOrg?.registrationId || "",
        kycDocumentUrl: existingOrg?.kycDocumentUrl || "",
        isRegisteredCompany: !!existingOrg?.registrationId,
        isAccredited: existingOrg?.isAccredited ?? false,
        accreditingBody: existingOrg?.accreditingBody || "",
        accreditationStatus: existingOrg?.accreditationStatus || (existingOrg?.isAccredited ? 'accredited' : 'unaccredited'),
        accreditationDocUrl: existingOrg?.accreditationDocUrl || ""
    }));

    const currencies = [
        { code: "NGN", name: "Nigerian Naira" },
        { code: "KES", name: "Kenyan Shilling" },
        { code: "ZAR", name: "South African Rand" },
        { code: "GHS", name: "Ghanaian Cedi" },
        { code: "USD", name: "US Dollar (Pan-Africa)" }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setLoading(true);

        try {
            if (existingOrg) {
                await updateOrganization(existingOrg.id, {
                    name: formData.name,
                    description: formData.description,
                    baseCurrency: formData.baseCurrency,
                    location: formData.location,
                    orgType: formData.orgType,
                    address: formData.address,
                    registrationId: formData.registrationId,
                    kycDocumentUrl: formData.kycDocumentUrl,
                    isAccredited: formData.isAccredited,
                    accreditingBody: formData.accreditingBody,
                    accreditationStatus: formData.accreditationStatus as 'accredited' | 'pending' | 'unaccredited',
                    accreditationDocUrl: formData.accreditationDocUrl,
                    kycVerified: existingOrg.kycVerified ?? false // retain status
                });
                alert("Organization Settings Updated");
            } else {
                const newOrgId = `org_${currentUser.id}`;
                await addOrganization({
                    id: newOrgId,
                    name: formData.name,
                    description: formData.description,
                    baseCurrency: formData.baseCurrency,
                    location: formData.location,
                    orgType: formData.orgType,
                    ownerId: currentUser.id,
                    address: formData.address,
                    registrationId: formData.registrationId,
                    kycDocumentUrl: formData.kycDocumentUrl,
                    isAccredited: formData.isAccredited,
                    accreditingBody: formData.accreditingBody,
                    accreditationStatus: formData.accreditationStatus as 'accredited' | 'pending' | 'unaccredited',
                    accreditationDocUrl: formData.accreditationDocUrl
                });
                
                if (currentUser.role !== 'organization') {
                     await updateDoc(doc(db, 'users', currentUser.id), { role: 'organization' });
                }
                setStep(4);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-12">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-8 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{existingOrg ? 'Organization Settings' : 'Organization Setup'}</h1>
                    <p className="text-slate-500 dark:text-slate-400">Configure your organization profile and KYC verification.</p>
                    {!existingOrg && (
                        <div className="flex items-center space-x-2 mt-6">
                            <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-indigo-500' : 'bg-slate-100 dark:bg-slate-700'}`}></div>
                            <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-indigo-500' : 'bg-slate-100 dark:bg-slate-700'}`}></div>
                            <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-700'}`}></div>
                        </div>
                    )}
                </div>

                <div className="p-0">
                    {existingOrg ? (
                        <form onSubmit={handleSubmit} className="p-8 space-y-8 animate-in fade-in">
                            {/* ALL IN ONE FORM FOR EXISTING ORG */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Organization Name</label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white" />
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Organization Type</label>
                                    <select value={formData.orgType} onChange={(e) => setFormData({...formData, orgType: e.target.value as 'basic' | 'higher' | 'vocational'})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white">
                                        <option value="basic">Basic Education</option>
                                        <option value="higher">Higher Education</option>
                                        <option value="vocational">Vocational Education</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Short Description</label>
                                    <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white h-20" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">HQ Location / Country</label>
                                    <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Base Currency</label>
                                    <select value={formData.baseCurrency} onChange={(e) => setFormData({...formData, baseCurrency: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white">
                                        {currencies.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">KYC Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Company Physical Address</label>
                                        <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white h-16" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input type="checkbox" checked={formData.isRegisteredCompany} onChange={e => setFormData({...formData, isRegisteredCompany: e.target.checked})} className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-900" />
                                            <span className="text-slate-900 dark:text-white font-medium">We are a registered company</span>
                                        </label>
                                    </div>
                                     {formData.isRegisteredCompany && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Company Registration ID</label>
                                                <input type="text" value={formData.registrationId} onChange={(e) => setFormData({...formData, registrationId: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white" placeholder="e.g. RC 123456" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Registration Certificate (PDF/Image)</label>
                                                <FileUpload label="Upload Certificate" onUpload={(url) => setFormData({...formData, kycDocumentUrl: url})} />
                                                {formData.kycDocumentUrl && <div className="mt-2 text-xs text-emerald-400 font-medium">Document uploaded successfully.</div>}
                                            </div>
                                        </>
                                    )}

                                    {/* ACCREDITATION SECTION */}
                                    <div className="md:col-span-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input type="checkbox" checked={formData.isAccredited} onChange={e => setFormData({...formData, isAccredited: e.target.checked})} className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-900" />
                                            <span className="text-slate-900 dark:text-white font-medium">Institution is Accredited by Official Educational Bodies</span>
                                        </label>
                                    </div>
                                    {formData.isAccredited && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Accrediting Body Name</label>
                                                <input type="text" value={formData.accreditingBody} onChange={(e) => setFormData({...formData, accreditingBody: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white" placeholder="e.g. NUC, Ministry of Education, TVET" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Accreditation Status</label>
                                                <select value={formData.accreditationStatus} onChange={(e) => setFormData({...formData, accreditationStatus: e.target.value as 'accredited' | 'pending' | 'unaccredited'})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white">
                                                    <option value="accredited">Fully Accredited</option>
                                                    <option value="pending">Accreditation Pending</option>
                                                    <option value="unaccredited">Provisional / Unaccredited</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Upload Accreditation Certificate / Proof</label>
                                                <FileUpload label="Upload Accreditation Document" onUpload={(url) => setFormData({...formData, accreditationDocUrl: url})} />
                                                {formData.accreditationDocUrl && <div className="mt-2 text-xs text-emerald-400 font-medium">Accreditation proof uploaded successfully.</div>}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 border-b border-slate-200 dark:border-slate-700 pb-8">
                                <button type="submit" disabled={loading} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-slate-900 dark:text-white rounded-lg font-bold flex items-center transition-colors">
                                    {loading ? 'Saving...' : 'Save Settings'} <Save className="w-4 h-4 ml-2" />
                                </button>
                            </div>

                            {/* Paystack Split Payouts Onboarding Section */}
                            <div className="pt-6">
                                <PaystackSubaccountOnboarding />
                            </div>
                        </form>
                    ) : (
                        <div className="p-8">
                            {/* MULTI-STEP FOR NEW ORG */}
                            {step === 1 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Organization Name</label>
                                            <div className="relative">
                                                <Building className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Africa Tech Academy" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Organization Type</label>
                                            <div className="relative">
                                                <Building className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                                <select value={formData.orgType} onChange={(e) => setFormData({...formData, orgType: e.target.value as 'basic' | 'higher' | 'vocational'})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 appearance-none">
                                                    <option value="basic">Basic Education (Nursery, Primary, Secondary)</option>
                                                    <option value="higher">Higher Education (Universities, Colleges)</option>
                                                    <option value="vocational">Vocational Education (NGOs, Institutes)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Short Description</label>
                                            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 h-24" placeholder="What does your organization teach?" />
                                        </div>
                                    </div>
                                    <button onClick={() => setStep(2)} disabled={!formData.name || !formData.description} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-slate-900 dark:text-white rounded-lg py-3 font-medium flex items-center justify-center transition-colors">
                                        Continue <ArrowRight className="w-4 h-4 ml-2" />
                                    </button>
                                </div>
                            )}
                            {step === 2 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Headquarters Location</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                                <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Lagos, Nigeria" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Base Currency</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                                <select value={formData.baseCurrency} onChange={(e) => setFormData({...formData, baseCurrency: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 appearance-none">
                                                    {currencies.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button type="button" onClick={() => setStep(1)} className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors">Back</button>
                                        <button type="button" onClick={() => setStep(3)} disabled={!formData.location} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-slate-900 dark:text-white rounded-lg py-3 font-medium flex items-center justify-center transition-colors">
                                            Continue <ArrowRight className="w-4 h-4 ml-2" />
                                        </button>
                                    </div>
                                </div>
                            )}
                            {step === 3 && (
                                <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Company Physical Address</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                                <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 123 Tech Lane" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="flex items-center space-x-3 cursor-pointer">
                                                <input type="checkbox" checked={formData.isRegisteredCompany} onChange={e => setFormData({...formData, isRegisteredCompany: e.target.checked})} className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-900" />
                                                <span className="text-slate-900 dark:text-white font-medium">We are a registered company</span>
                                            </label>
                                        </div>
                                        {formData.isRegisteredCompany && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Registration ID (e.g. RC Number)</label>
                                                    <div className="relative">
                                                        <FileText className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                                        <input type="text" value={formData.registrationId} onChange={(e) => setFormData({...formData, registrationId: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Upload Registration Certificate (PDF/Image)</label>
                                                    <FileUpload label="Upload Document" onUpload={(url) => setFormData({...formData, kycDocumentUrl: url})} />
                                                    {formData.kycDocumentUrl && <div className="mt-2 text-xs text-emerald-400 font-medium">Document uploaded successfully.</div>}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex space-x-3">
                                        <button type="button" onClick={() => setStep(2)} className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors">Back</button>
                                        <button type="submit" disabled={!formData.address || (formData.isRegisteredCompany && (!formData.registrationId || !formData.kycDocumentUrl)) || loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-slate-900 dark:text-white rounded-lg py-3 font-medium flex items-center justify-center transition-colors">
                                            {loading ? 'Saving...' : 'Complete Setup'} <CheckCircle2 className="w-4 h-4 ml-2" />
                                        </button>
                                    </div>
                                </form>
                            )}
                            {step === 4 && (
                                <div className="py-8 text-center animate-in fade-in zoom-in-95 duration-500">
                                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Organization Setup Complete!</h2>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default Onboarding;
