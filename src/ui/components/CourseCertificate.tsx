import React, { useState } from 'react';
import { Course } from '../../types';
import { useAppContext } from '../../store/AppContext';
import { Award, Download, Settings } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { FileUpload } from './FileUpload';

export const CourseCertificate = ({ course, isStudent, progress }: { course: Course, isStudent: boolean, progress: number }) => {
    const { updateCourse, organizations } = useAppContext();
    const courseOrg = organizations.find(o => o.id === course.orgId);
    const defaultOrgName = courseOrg?.name || 'Organization Name';
    const defaultQualificationTitle = course.qualificationTitle || 'Certificate of Completion';
    const { currentUser } = useAuth();
    
    const config = course.certificateConfig || { 
        enabled: false, 
        customText: 'Certificate of Completion',
        orgName: defaultOrgName,
        gradeLevel: '',
        qualificationTitle: defaultQualificationTitle,
        signatureUrl: '',
        authorizedSealUrl: ''
    };

    const [isEditing, setIsEditing] = useState(false);
    const [enabled, setEnabled] = useState(config.enabled || false);
    const [customText, setCustomText] = useState(config.customText || 'Certificate of Completion');
    const [orgName, setOrgName] = useState(config.orgName || defaultOrgName);
    const [gradeLevel, setGradeLevel] = useState(config.gradeLevel || '');
    const [qualificationTitle, setQualificationTitle] = useState(config.qualificationTitle || defaultQualificationTitle);
    const [signatureUrl, setSignatureUrl] = useState(config.signatureUrl || '');
    const [authorizedSealUrl, setAuthorizedSealUrl] = useState(config.authorizedSealUrl || '');

    const handleSave = async () => {
        await updateCourse(course.id, {
            certificateConfig: { 
                enabled, 
                customText,
                orgName,
                gradeLevel,
                qualificationTitle,
                signatureUrl,
                authorizedSealUrl
            }
        });
        setIsEditing(false);
    };

    const handleDownload = () => {
        alert('Certificate downloaded successfully!');
    };

    const studentName = isStudent ? currentUser?.name : "[Student Name]";
    const certId = isStudent ? `CERT-${course.id.substring(0,6).toUpperCase()}-${currentUser?.id.substring(0,6).toUpperCase()}` : `CERT-[ID]`;
    const dateIssued = isStudent && progress >= 100 ? new Date().toLocaleDateString() : "[Date of Issue]";

    const renderCertificatePreview = () => (
        <div className="max-w-2xl mx-auto aspect-[1.414] bg-white text-slate-900 border-[12px] border-double border-slate-300 p-8 flex flex-col relative mb-8 shadow-xl">
            {authorizedSealUrl && (
                <div className="absolute top-8 right-8 w-24 h-24 opacity-20 pointer-events-none">
                    <img src={authorizedSealUrl} alt="Seal" className="w-full h-full object-contain" />
                </div>
            )}
            
            <div className="text-center flex-1 flex flex-col justify-center">
                <div className="text-sm uppercase tracking-widest text-slate-500 font-bold mb-6">{orgName || defaultOrgName}</div>
                
                <div className="text-4xl sm:text-5xl font-serif text-slate-900 mb-8">{customText}</div>
                
                <div className="text-sm text-slate-500 mb-2">This certifies that</div>
                <div className="text-2xl font-bold text-indigo-700 mb-6 italic">{studentName}</div>
                
                <div className="text-sm text-slate-500 mb-2">has successfully completed</div>
                <div className="text-xl font-bold text-slate-800 mb-2">{qualificationTitle || 'Certificate of Excellence'}</div>
                <div className="text-md font-semibold text-slate-600 mb-2">in {course.title}</div>
                {gradeLevel && <div className="text-md text-slate-600 mb-8">Grade Level: {gradeLevel}</div>}
            </div>

            <div className="flex justify-between items-end border-t border-slate-200 pt-6 mt-8">
                <div className="text-left">
                    <div className="text-xs text-slate-500 font-mono mb-1">ID: {certId}</div>
                    <div className="text-xs text-slate-500 font-mono">Date: {dateIssued}</div>
                </div>
                
                {signatureUrl ? (
                    <div className="text-center">
                        <img src={signatureUrl} alt="Signature" className="h-12 object-contain mb-2" />
                        <div className="text-xs uppercase tracking-wider font-bold text-slate-500 border-t border-slate-300 pt-1">Authorized Signature</div>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="h-12 mb-2 border-b border-slate-300 w-32 mx-auto"></div>
                        <div className="text-xs uppercase tracking-wider font-bold text-slate-500">Authorized Signature</div>
                    </div>
                )}
            </div>
        </div>
    );

    if (isStudent) {
        if (!config.enabled) {
            return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Certificates are not enabled for this course.</div>;
        }
        if (progress < 100) {
            return (
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Certificate Locked</h3>
                    <p className="text-slate-500 dark:text-slate-400">Complete all modules and assessments (100%) to unlock your certificate.</p>
                    <div className="mt-4 text-2xl font-bold text-indigo-400">{progress.toFixed(0)}% Completed</div>
                </div>
            );
        }
        return (
            <div className="p-8 text-center">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                    <Award className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Congratulations!</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">You have successfully completed this course and earned your certificate.</p>
                {renderCertificatePreview()}
                <button onClick={handleDownload} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white font-bold rounded-xl flex items-center justify-center mx-auto transition-colors">
                    <Download className="w-5 h-5 mr-2" /> Download Certificate
                </button>
            </div>
        );
    }

    // Admin / Instructor View
    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center"><Award className="w-5 h-5 mr-2 text-indigo-400" /> Certificate Settings</h2>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition flex items-center">
                        <Settings className="w-4 h-4 mr-2" /> Edit Design
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="flex items-center space-x-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                            <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-900" />
                            <span className="text-slate-900 dark:text-white font-medium">Enable Certificates for this Course</span>
                        </label>
                        
                        {enabled && (
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Organization Name</label>
                                        <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full">Auto-picked from Org</span>
                                    </div>
                                    <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Certificate Header Text</label>
                                    <input type="text" value={customText} onChange={e => setCustomText(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Qualification Title</label>
                                        <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full">Auto-picked from Course</span>
                                    </div>
                                    <input type="text" value={qualificationTitle} onChange={e => setQualificationTitle(e.target.value)} placeholder="e.g. Bachelor of Science / Diploma of Excellence" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Grade Level (Optional)</label>
                                    <input type="text" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Authorized Signature</label>
                                        <FileUpload label="Upload Signature" accept="image/*" onUpload={(url) => setSignatureUrl(url)} />
                                        {signatureUrl && <img src={signatureUrl} alt="Signature" className="h-12 mt-2 object-contain bg-white rounded p-1" />}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Official Seal</label>
                                        <FileUpload label="Upload Seal" accept="image/*" onUpload={(url) => setAuthorizedSealUrl(url)} />
                                        {authorizedSealUrl && <img src={authorizedSealUrl} alt="Seal" className="h-12 mt-2 object-contain bg-white rounded p-1" />}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex space-x-3 pt-6">
                            <button onClick={handleSave} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white rounded-lg font-bold transition">Save Design</button>
                            <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-bold transition">Cancel</button>
                        </div>
                    </div>
                    
                    {enabled && (
                        <div>
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">Live Preview</h3>
                            <div className="transform scale-[0.85] origin-top-left lg:origin-top w-[117%]">
                                {renderCertificatePreview()}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Status</div>
                            <div className={`font-bold text-lg ${config.enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {config.enabled ? 'Enabled' : 'Disabled'}
                            </div>
                        </div>
                    </div>
                    {config.enabled && (
                        <div className="mt-8">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Certificate Preview</h3>
                            {renderCertificatePreview()}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
