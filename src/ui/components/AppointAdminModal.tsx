import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAppContext } from "../../store/AppContext";
import { useAuth } from "../../store/AuthContext";
import { Shield, X, UserCheck, CheckCircle2, Users, Trash2, User, ShieldCheck, Mail } from "lucide-react";
import { OrgMember, User as AppUser } from "../../types";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { generateId } from "../../lib/id";

interface AppointAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppointAdminModal: React.FC<AppointAdminModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { orgMembers, addOrgMember, deleteOrgMember, organizations } = useAppContext();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [inviteNote, setInviteNote] = useState("");
  
  const [registeredUsers, setRegisteredUsers] = useState<AppUser[]>([]);
  const [selectedAppUserId, setSelectedAppUserId] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch registered users on Backpack from Firestore
  useEffect(() => {
    if (!isOpen || !currentUser) return;
    const fetchRegisteredUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'backpack'));
        const usersList: AppUser[] = [];
        snap.forEach(doc => {
          const data = doc.data();
          const userObj = Array.isArray(data.user) ? data.user[0] : data.user;
          const personalInfo = userObj?.personalInformation;
          
          if (personalInfo && doc.id !== currentUser.id) {
            usersList.push({
              id: doc.id,
              name: personalInfo.fullname || personalInfo.name || 'User',
              email: personalInfo.email || '',
              role: personalInfo.role || 'student',
              createdAt: personalInfo.createdAt || ''
            });
          }
        });
        setRegisteredUsers(usersList);
      } catch (err) {
        console.error("Error fetching registered users:", err);
      }
    };

    fetchRegisteredUsers();
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const currentOrgId = currentUser.role === 'organization' ? `org_${currentUser.id}` : 
    (orgMembers.find(m => m.email?.toLowerCase() === currentUser.email?.toLowerCase())?.orgId || "");

  const myOrg = organizations.find(o => o.id === currentOrgId || o.ownerId === currentUser.id);

  // Filter existing admin members for this org
  const orgAdmins = orgMembers.filter(
    (m) => (m.orgId === currentOrgId || m.orgId === currentUser.id || m.orgId === `org_${currentUser.id}`) && m.role === 'admin'
  );

  const handleAppointAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    const cleanEmail = email.trim().toLowerCase();

    // Check if target email belongs to an organization account
    const matchedUser = registeredUsers.find(u => u.email?.toLowerCase() === cleanEmail);
    if (matchedUser && matchedUser.role === 'organization') {
      setErrorMsg("Organization accounts cannot be appointed as admin staff.");
      setIsSubmitting(false);
      return;
    }

    const newAdminMember: OrgMember = {
      id: generateId('member'),
      orgId: currentOrgId,
      name: name.trim(),
      email: cleanEmail,
      role: 'admin',
      department: department.trim() || 'Operations & Management',
      courseIds: [],
      joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'active',
      requiresPayment: false,
      requiresDocuments: false,
      inviteNote: inviteNote.trim() || undefined,
    };

    try {
      await addOrgMember(newAdminMember);
      setSuccessMsg(`Successfully appointed ${name} (${cleanEmail}) as Organization Admin!`);
      setName("");
      setEmail("");
      setDepartment("");
      setInviteNote("");
      setSelectedAppUserId("");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Error appointing admin:", err);
      setErrorMsg("Failed to appoint admin staff. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (id: string, adminName: string) => {
    if (window.confirm(`Are you sure you want to revoke admin permissions for ${adminName}?`)) {
      try {
        await deleteOrgMember(id);
        setSuccessMsg(`Revoked admin access for ${adminName}.`);
        setTimeout(() => setSuccessMsg(""), 3000);
      } catch (err) {
        console.error("Error deleting admin:", err);
      }
    }
  };

  const modalContent = (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto relative z-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Appoint Organization Admin</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grant administrative staff access to {myOrg?.name || 'Organization'} portal & dashboards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-3.5 rounded-xl flex items-center space-x-2.5 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-3.5 rounded-xl flex items-center space-x-2.5 text-xs font-semibold">
              <X className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAppointAdmin} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-4">
            <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 p-3 rounded-xl text-xs font-medium flex items-center">
              <ShieldCheck className="w-4 h-4 mr-2 flex-shrink-0 text-indigo-500" />
              <span>
                <strong>Admin Privileges:</strong> Organization Admins have full access to manage courses, review admissions, oversee cohorts, and view analytics in the organization portal.
              </span>
            </div>

            {/* Pick Registered User */}
            {registeredUsers.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
                  <User className="w-3.5 h-3.5 mr-1 text-indigo-500" /> Choose Existing Registered Backpack User
                </label>
                <select
                  value={selectedAppUserId}
                  onChange={(e) => {
                    const uid = e.target.value;
                    setSelectedAppUserId(uid);
                    const found = registeredUsers.find(u => u.id === uid);
                    if (found) {
                      setName(found.name || "");
                      setEmail(found.email || "");
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose registered user to appoint --</option>
                  {registeredUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) - {u.role.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. David Sterling"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. david@organization.edu"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Admin Title / Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Academic Dean / Operations Manager"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting || !name.trim() || !email.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Appointing...' : 'Appoint Admin Manager'}</span>
              </button>
            </div>
          </form>

          {/* Current Admins List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center">
              <Users className="w-4 h-4 mr-1.5 text-indigo-500" />
              Active Admin Managers ({orgAdmins.length})
            </h3>

            {orgAdmins.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-700/50">
                No additional administrative staff appointed yet.
              </p>
            ) : (
              <div className="space-y-2">
                {orgAdmins.map((admin) => (
                  <div
                    key={admin.id}
                    className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs">{admin.name}</h4>
                          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-full">
                            Admin Staff
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center mt-0.5">
                          <Mail className="w-3 h-3 mr-1" /> {admin.email} • {admin.department || 'Operations'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveAdmin(admin.id, admin.name)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                      title="Revoke Admin Access"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
