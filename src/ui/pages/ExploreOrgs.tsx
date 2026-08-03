import { useAppContext } from "../../store/AppContext";
import { Building, MapPin, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ExploreOrgs = () => {
    const { organizations } = useAppContext();
    const navigate = useNavigate();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Explore Organizations</h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">Discover educational institutions across Africa.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizations.map(org => (
                    <div 
                        key={org.id} 
                        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500/20 transition-all cursor-pointer shadow-sm group"
                        onClick={() => navigate(`/org/${org.id}`)}
                    >
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                                    <Building className="w-6 h-6 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors" />
                                </div>
                                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center">
                                    <DollarSign className="w-3 h-3 mr-1" /> {org.baseCurrency}
                                </span>
                            </div>
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{org.name}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">{org.description}</p>
                                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                                        <MapPin className="w-4 h-4 mr-1" /> {org.location}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExploreOrgs;
