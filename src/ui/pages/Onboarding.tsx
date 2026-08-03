import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../store/AppContext";
import { useAuth } from "../../store/AuthContext";
import { Building, MapPin, DollarSign, ArrowRight, CheckCircle2 } from "lucide-react";
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const Onboarding = () => {
    const navigate = useNavigate();
    const { addOrganization } = useAppContext();
    const { currentUser } = useAuth();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        location: "",
        baseCurrency: "NGN",
        orgType: "basic" as 'basic' | 'higher' | 'vocational',
    });
    const [loading, setLoading] = useState(false);

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

        const newOrgId = `org_${currentUser.id}`;
        try {
            await addOrganization({
                id: newOrgId,
                name: formData.name,
                description: formData.description,
                baseCurrency: formData.baseCurrency,
                location: formData.location,
                orgType: formData.orgType,
                ownerId: currentUser.id
            });
            
            // Just update the user document if they are not already an org
            if (currentUser.role !== 'organization') {
                 await updateDoc(doc(db, 'users', currentUser.id), { role: 'organization' });
            }
            
            setStep(3);
            setTimeout(() => navigate("/dashboard"), 2000);
        } catch (err) {
            console.error("Failed to onboard org", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-12">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="p-8 border-b border-slate-700 bg-slate-800/50">
                    <h1 className="text-2xl font-bold text-white mb-2">Organization Setup</h1>
                    <p className="text-slate-400">Configure your Backpack presence and settings.</p>
                    <div className="flex items-center space-x-2 mt-6">
                        <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                        <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                        <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                    </div>
                </div>

                <div className="p-8">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Organization Name</label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
                                            placeholder="e.g. Africa Tech Academy"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Organization Type</label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                        <select
                                            value={formData.orgType}
                                            onChange={(e) => setFormData({...formData, orgType: e.target.value as 'basic' | 'higher' | 'vocational'})}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 appearance-none"
                                        >
                                            <option value="basic">Basic Education (Nursery, Primary, Secondary)</option>
                                            <option value="higher">Higher Education (Universities, Colleges)</option>
                                            <option value="vocational">Vocational Education (NGOs, Institutes)</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Short Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 h-24"
                                        placeholder="What does your organization teach?"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => setStep(2)}
                                disabled={!formData.name || !formData.description}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-3 font-medium flex items-center justify-center transition-colors"
                            >
                                Continue <ArrowRight className="w-4 h-4 ml-2" />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Headquarters Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500"
                                            placeholder="e.g. Lagos, Nigeria"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Base Currency</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                                        <select
                                            value={formData.baseCurrency}
                                            onChange={(e) => setFormData({...formData, baseCurrency: e.target.value})}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 appearance-none"
                                        >
                                            {currencies.map(c => (
                                                <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={!formData.location || loading}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-3 font-medium flex items-center justify-center transition-colors"
                                >
                                    {loading ? 'Saving...' : 'Complete Setup'} <CheckCircle2 className="w-4 h-4 ml-2" />
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 3 && (
                        <div className="py-8 text-center animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Organization Setup Complete!</h2>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default Onboarding;
