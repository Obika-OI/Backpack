import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { useAccessibility } from '../../store/AccessibilityContext';
import { Organization } from '../../types';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Users, 
  Search, 
  Building2, 
  Volume2, 
  Trash2, 
  X,
  Circle
} from 'lucide-react';
import { FileUpload } from './FileUpload';
import { generateId } from '../../lib/id';

interface OrgLunchChatProps {
  onClose?: () => void;
}

export const OrgLunchChat: React.FC<OrgLunchChatProps> = ({ onClose }) => {
  const { 
    organizations, 
    orgMembers, 
    courses, 
    enrollmentRequests,
    orgChatMessages, 
    sendOrgChatMessage, 
    deleteOrgChatMessage 
  } = useAppContext();
  
  const { currentUser } = useAuth();
  const { speakText } = useAccessibility();

  // 1. Identify all organizations associated with this user
  const associatedOrgs = useMemo(() => {
    if (!currentUser) return [];

    const orgMap = new Map<string, Organization>();

    // A. User is the owner of the organization
    organizations.forEach(org => {
      if (org.ownerId === currentUser.id || org.id === currentUser.id || org.id === `org_${currentUser.id}`) {
        orgMap.set(org.id, org);
      }
    });

    // B. User is in orgMembers roster
    const myMemberEntries = orgMembers.filter(m => 
      m.userId === currentUser.id || 
      (m.email && currentUser.email && m.email.toLowerCase() === currentUser.email.toLowerCase())
    );

    myMemberEntries.forEach(m => {
      const matchedOrg = organizations.find(o => o.id === m.orgId || o.ownerId === m.orgId);
      if (matchedOrg) {
        orgMap.set(matchedOrg.id, matchedOrg);
      }
    });

    // C. User is enrolled in courses belonging to an organization
    const myEnrollments = enrollmentRequests.filter(r => 
      r.userId === currentUser.id && (r.status === 'approved' || r.status === 'pending')
    );

    myEnrollments.forEach(enr => {
      const course = courses.find(c => c.id === enr.courseId);
      if (course) {
        const matchedOrg = organizations.find(o => o.id === course.orgId || o.ownerId === course.orgId);
        if (matchedOrg) {
          orgMap.set(matchedOrg.id, matchedOrg);
        }
      }
    });

    // Fallback: If still empty, include any organizations registered in the platform for exploration
    if (orgMap.size === 0 && organizations.length > 0) {
      // Include first available organizations as open campus lobbies
      organizations.slice(0, 3).forEach(org => orgMap.set(org.id, org));
    }

    return Array.from(orgMap.values());
  }, [currentUser, organizations, orgMembers, courses, enrollmentRequests]);

  const [selectedOrgIdState, setSelectedOrgIdState] = useState<string>('');

  const selectedOrgId = useMemo(() => {
    if (selectedOrgIdState && (associatedOrgs.some(o => o.id === selectedOrgIdState) || organizations.some(o => o.id === selectedOrgIdState))) {
      return selectedOrgIdState;
    }
    return associatedOrgs[0]?.id || organizations[0]?.id || '';
  }, [selectedOrgIdState, associatedOrgs, organizations]);

  const activeOrg = useMemo(() => {
    return organizations.find(o => o.id === selectedOrgId) || associatedOrgs[0] || null;
  }, [selectedOrgId, organizations, associatedOrgs]);

  // Selected recipient for 1-on-1 direct chat, or null for the Org All-Members Lounge
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: string; name: string; role: string; email?: string } | null>(null);
  
  const [searchMemberQuery, setSearchMemberQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string; type: 'image' | 'video' | 'document' } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showMembersMobile, setShowMembersMobile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 2. Compute all members of the active organization
  const orgRoster = useMemo(() => {
    if (!activeOrg) return [];

    const members: Array<{ id: string; name: string; role: string; email?: string; isOwner?: boolean }> = [];
    const seenEmails = new Set<string>();

    // A. Add Org Owner
    if (activeOrg.name) {
      members.push({
        id: activeOrg.ownerId || activeOrg.id,
        name: `${activeOrg.name} (Administration)`,
        role: 'admin',
        isOwner: true
      });
      seenEmails.add(activeOrg.ownerId);
    }

    // B. Add all members from orgMembers
    const filteredMembers = orgMembers.filter(m => m.orgId === activeOrg.id || m.orgId === activeOrg.ownerId);
    filteredMembers.forEach(m => {
      if (!seenEmails.has(m.email?.toLowerCase() || m.id)) {
        seenEmails.add(m.email?.toLowerCase() || m.id);
        members.push({
          id: m.userId || m.id,
          name: m.name,
          role: m.role,
          email: m.email
        });
      }
    });

    // C. Add students enrolled in this org's courses
    const orgCourses = courses.filter(c => c.orgId === activeOrg.id || c.orgId === activeOrg.ownerId);
    const orgCourseIds = new Set(orgCourses.map(c => c.id));
    
    enrollmentRequests.forEach(enr => {
      if (orgCourseIds.has(enr.courseId) && enr.userName) {
        if (!seenEmails.has(enr.userEmail?.toLowerCase() || enr.userId)) {
          seenEmails.add(enr.userEmail?.toLowerCase() || enr.userId);
          members.push({
            id: enr.userId,
            name: enr.userName,
            role: 'student',
            email: enr.userEmail
          });
        }
      }
    });

    return members;
  }, [activeOrg, orgMembers, courses, enrollmentRequests]);

  // Filter roster by search
  const filteredRoster = useMemo(() => {
    if (!searchMemberQuery.trim()) return orgRoster;
    const q = searchMemberQuery.toLowerCase();
    return orgRoster.filter(m => 
      m.name.toLowerCase().includes(q) || 
      (m.email && m.email.toLowerCase().includes(q)) ||
      m.role.toLowerCase().includes(q)
    );
  }, [orgRoster, searchMemberQuery]);

  // 3. Filter messages for the current view:
  // - If selectedRecipient is null -> messages where orgId matches AND recipientId is null/empty (Lounge)
  // - If selectedRecipient is set -> direct messages between currentUser.id and selectedRecipient.id
  const currentMessages = useMemo(() => {
    if (!activeOrg || !currentUser) return [];

    return (orgChatMessages || []).filter(msg => {
      // Must match current organization
      if (msg.orgId !== activeOrg.id && msg.orgId !== activeOrg.ownerId) return false;

      if (!selectedRecipient) {
        // Lounge: public messages with no direct recipient
        return !msg.recipientId;
      } else {
        // 1-on-1 DM: either sent by current user to recipient OR sent by recipient to current user
        return (
          (msg.senderId === currentUser.id && msg.recipientId === selectedRecipient.id) ||
          (msg.senderId === selectedRecipient.id && msg.recipientId === currentUser.id)
        );
      }
    }).sort((a, b) => a.timestamp - b.timestamp);
  }, [activeOrg, currentUser, selectedRecipient, orgChatMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || (!inputText.trim() && !attachedFile) || !activeOrg) return;

    setIsSending(true);
    try {
      await sendOrgChatMessage({
        id: generateId('chat'),
        orgId: activeOrg.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderEmail: currentUser.email,
        senderRole: currentUser.role,
        recipientId: selectedRecipient ? selectedRecipient.id : undefined,
        recipientName: selectedRecipient ? selectedRecipient.name : undefined,
        text: inputText.trim(),
        fileUrl: attachedFile?.url,
        fileName: attachedFile?.name,
        fileType: attachedFile?.type,
        timestamp: Date.now()
      });

      setInputText("");
      setAttachedFile(null);
    } catch (err) {
      console.error("Failed to send org chat message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const roleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin':
      case 'organization':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'instructor':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col h-[740px] max-h-[85vh]">
      {/* Top Bar: Organization Switcher & Lounge Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-slate-900/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {activeOrg?.name || "Institution Direct Messaging"}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center">
                <Circle className="w-2 h-2 fill-emerald-500 mr-1 animate-pulse" /> Direct Personal Chat
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct personal messaging between isolated users associated with {activeOrg?.name || 'this organization'}.
            </p>
          </div>
        </div>

        {/* Organization Selector Dropdown */}
        <div className="flex items-center space-x-2">
          {associatedOrgs.length > 1 && (
            <div className="relative">
              <select
                value={selectedOrgId}
                onChange={(e) => {
                  setSelectedOrgIdState(e.target.value);
                  setSelectedRecipient(null);
                }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                {associatedOrgs.map(org => (
                  <option key={org.id} value={org.id}>
                    🏛️ {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowMembersMobile(!showMembersMobile)}
            className="md:hidden px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1"
          >
            <Users className="w-4 h-4" />
            <span>Contacts ({filteredRoster.length})</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Layout: Left Side Roster + Right Side Chat Window */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Member Contacts Roster */}
        <div className={`w-full md:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/60 shrink-0 ${
          showMembersMobile ? 'block absolute inset-0 z-30 bg-white dark:bg-slate-900 md:relative' : 'hidden md:flex'
        }`}>
          {/* Mobile close header */}
          {showMembersMobile && (
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between md:hidden">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Organization Contacts</h3>
              <button 
                onClick={() => setShowMembersMobile(false)}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* General Lounge Channel */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                setSelectedRecipient(null);
                setShowMembersMobile(false);
              }}
              className={`w-full p-3 rounded-2xl text-left transition flex items-center justify-between ${
                selectedRecipient === null
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold border border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  selectedRecipient === null ? 'bg-white/20 text-white' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                }`}>
                  <Users className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="text-xs block truncate"># All-Members Lounge</span>
                  <span className={`text-[10px] block opacity-80 ${selectedRecipient === null ? 'text-indigo-100' : 'text-slate-400'}`}>
                    Open Public Organization Chat
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Search Contacts */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchMemberQuery}
                onChange={(e) => setSearchMemberQuery(e.target.value)}
                placeholder="Search organization contacts..."
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Member List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Direct Personal Contacts ({filteredRoster.length})
            </div>

            {filteredRoster.map(member => {
              const isSelected = selectedRecipient?.id === member.id;
              const isSelf = currentUser && (currentUser.id === member.id || currentUser.email === member.email);

              return (
                <button
                  key={member.id}
                  onClick={() => {
                    setSelectedRecipient(member);
                    setShowMembersMobile(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}>
                        {member.name.charAt(0)}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                    </div>
                    <div className="truncate">
                      <span className={`text-xs truncate block font-semibold ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                        {member.name} {isSelf && '(You)'}
                      </span>
                      <span className={`text-[10px] capitalize block ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {member.role}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border capitalize shrink-0 ${
                    isSelected ? 'bg-white/20 text-white border-white/30' : roleBadgeColor(member.role)
                  }`}>
                    {member.role}
                  </span>
                </button>
              );
            })}

            {filteredRoster.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400 italic">
                No organization contacts matching "{searchMemberQuery}"
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chat Dialogue Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
          {/* DM / Channel Header */}
          <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80">
            <div className="flex items-center space-x-2.5">
              {selectedRecipient ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                    {selectedRecipient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center">
                      <span>{selectedRecipient.name}</span>
                      <span className={`ml-2 px-2 py-0.2 rounded-full text-[9px] font-bold border capitalize ${roleBadgeColor(selectedRecipient.role)}`}>
                        {selectedRecipient.role}
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400">Direct 1-on-1 Personal Message</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      # All-Members Lounge ({activeOrg?.name})
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Public channel visible to all instructors, students, and admins in this organization.
                    </p>
                  </div>
                </>
              )}
            </div>

            {selectedRecipient && (
              <button
                type="button"
                onClick={() => setSelectedRecipient(null)}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition"
              >
                Return to Lounge &rarr;
              </button>
            )}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {currentMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedRecipient ? `Start a conversation with ${selectedRecipient.name}` : `Welcome to the ${activeOrg?.name || 'Organization'} Lounge!`}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    {selectedRecipient 
                      ? "Send your first direct message, inquiry, study note, or feedback." 
                      : "Say hello, discuss courses, share announcements, and collaborate with all institution members."}
                  </p>
                </div>
              </div>
            ) : (
              currentMessages.map(msg => {
                const isMine = currentUser && msg.senderId === currentUser.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-3 group ${isMine ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0 uppercase">
                      {msg.senderName ? msg.senderName.charAt(0) : 'U'}
                    </div>

                    <div className={`max-w-[75%] space-y-1 ${isMine ? 'items-end text-right' : ''}`}>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                          {msg.senderName}
                        </span>
                        {msg.senderRole && (
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border capitalize ${roleBadgeColor(msg.senderRole)}`}>
                            {msg.senderRole}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Bubble */}
                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed relative ${
                        isMine
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200/80 dark:border-slate-700/80'
                      }`}>
                        {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                        {/* File Attachment if any */}
                        {msg.fileUrl && (
                          <div className="mt-2 pt-2 border-t border-white/20 dark:border-slate-700">
                            {msg.fileType === 'image' ? (
                              <img 
                                src={msg.fileUrl} 
                                alt="Attachment" 
                                className="max-h-48 rounded-xl object-cover border border-white/20"
                              />
                            ) : (
                              <a
                                href={msg.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center space-x-2 text-xs font-bold underline ${
                                  isMine ? 'text-white hover:text-indigo-100' : 'text-indigo-600 dark:text-indigo-400'
                                }`}
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                                <span>{msg.fileName || 'View Attached File'}</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Message Actions */}
                      <div className={`flex items-center space-x-2 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ${isMine ? 'justify-end' : ''}`}>
                        {msg.text && (
                          <button
                            type="button"
                            onClick={() => speakText(msg.text)}
                            className="hover:text-indigo-500 flex items-center space-x-0.5"
                            title="Read Aloud (TTS)"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>Read</span>
                          </button>
                        )}
                        {isMine && (
                          <button
                            type="button"
                            onClick={() => deleteOrgChatMessage(msg.id)}
                            className="hover:text-red-500 flex items-center space-x-0.5"
                            title="Delete Message"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attached File Preview if chosen */}
          {attachedFile && (
            <div className="px-6 py-2 bg-indigo-50 dark:bg-indigo-950/40 border-t border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
              <div className="flex items-center space-x-2 truncate">
                <Paperclip className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="truncate font-semibold">Attached: {attachedFile.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="text-slate-400 hover:text-red-500 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Control Box */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center space-x-2">
            <div className="flex items-center space-x-1 shrink-0">
              <FileUpload
                label=""
                buttonText=""
                iconOnly={true}
                accept="image/*,.pdf,.doc,.docx,.zip"
                onUpload={(url) => {
                  const isImg = url.match(/\.(jpeg|jpg|gif|png|webp)/i) != null;
                  setAttachedFile({
                    url,
                    name: isImg ? 'Uploaded Image' : 'Document File',
                    type: isImg ? 'image' : 'document'
                  });
                }}
              />
            </div>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                selectedRecipient
                  ? `Message ${selectedRecipient.name}...`
                  : `Message all members of ${activeOrg?.name || 'organization'}...`
              }
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />

            <button
              type="submit"
              disabled={isSending || (!inputText.trim() && !attachedFile)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-bold text-xs transition flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 shrink-0"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
