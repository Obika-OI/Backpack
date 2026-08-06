import React, { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { Assessment, Submission } from '../../types';
import { Award, Plus, Paperclip, X } from 'lucide-react';
import { ProctoringSession } from './ProctoringSession';
import { FileUpload } from './FileUpload';

export const CourseAssessments = ({ courseId, isStudent }: { courseId: string, isStudent: boolean }) => {
    const { assessments, submissions, addAssessment, addSubmission, updateSubmissionScore, orgMembers } = useAppContext();
    const { currentUser } = useAuth();
    const courseAssessments = assessments.filter(a => a.courseId === courseId);
    const courseSubmissions = submissions.filter(s => s.courseId === courseId);
    
    const [title, setTitle] = useState("");
    const [type, setType] = useState<'assignment' | 'test' | 'exam' | 'project'>('assignment');
    const [maxScore, setMaxScore] = useState(100);
    const [dueDate, setDueDate] = useState("");
    const [isGroup, setIsGroup] = useState(false);
    
    // For grading
    const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
    const [gradingScores, setGradingScores] = useState<Record<string, number>>({});
    
    // For submitting
    const [submissionContent, setSubmissionContent] = useState("");
    const [submissionFileUrl, setSubmissionFileUrl] = useState("");
    const [activeProctoringId, setActiveProctoringId] = useState<string | null>(null);

    const handleCreateAssessment = async (e: React.FormEvent) => {
        e.preventDefault();
        const newAssessment: Assessment = {
            id: `ass_${crypto.randomUUID()}`,
            courseId,
            title,
            type,
            maxScore: Number(maxScore),
            dueDate,
            isGroup
        };
        await addAssessment(newAssessment);
        setTitle("");
        setMaxScore(100);
        setDueDate("");
        setIsGroup(false);
    };

    const handleSubmitAssessment = async (assessmentId: string) => {
        if (!currentUser || (!submissionContent.trim() && !submissionFileUrl)) return;
        const sub: Submission = {
            id: `sub_${crypto.randomUUID()}`,
            assessmentId,
            userId: currentUser.id,
            courseId,
            submittedAt: new Date().toISOString(),
            content: submissionContent,
            fileUrl: submissionFileUrl,
            status: 'submitted'
        };
        await addSubmission(sub);
        setSubmissionContent("");
        setSubmissionFileUrl("");
    };

    const handleGradeSubmission = async (submissionId: string) => {
        const score = gradingScores[submissionId] || 0;
        await updateSubmissionScore(submissionId, score, "Graded by instructor");
    };

    if (isStudent) {
        // Transcript view & Submission
        const mySubmissions = courseSubmissions.filter(s => s.userId === currentUser?.id);
        const totalScore = mySubmissions.reduce((acc, sub) => acc + (sub.score || 0), 0);
        const totalMaxScore = courseAssessments.reduce((acc, ass) => acc + ass.maxScore, 0);
        const gpa = totalMaxScore > 0 ? ((totalScore / totalMaxScore) * 4.0).toFixed(2) : "N/A";

        return (
            <div className="space-y-6">
                <div className="bg-indigo-900/40 p-6 rounded-2xl border border-indigo-500/30 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center"><Award className="w-5 h-5 mr-2 text-amber-400" /> Academic Transcript</h3>
                        <p className="text-sm text-indigo-200">Track your performance across assignments and exams.</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{totalScore} <span className="text-lg text-indigo-300 font-medium">/ {totalMaxScore}</span></div>
                        <div className="text-sm font-semibold text-emerald-400 mt-1">GPA Equivalent: {gpa}</div>
                    </div>
                </div>

                <div className="space-y-4">
                    {courseAssessments.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl">No assessments scheduled yet.</div>
                    ) : (
                        courseAssessments.map(ass => {
                            const sub = mySubmissions.find(s => s.assessmentId === ass.id);
                            return (
                                <div key={ass.id} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                                                {ass.title}
                                                {ass.isGroup && <span className="ml-2 px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded-full border border-purple-500/20">Group</span>}
                                            </h4>
                                            <div className="flex space-x-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                <span className="capitalize">{ass.type}</span>
                                                <span>•</span>
                                                <span>Due: {new Date(ass.dueDate).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span>Max: {ass.maxScore} pts</span>
                                            </div>
                                        </div>
                                        {sub ? (
                                            <div className="flex flex-col items-end">
                                                {sub.status === 'graded' ? (
                                                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-center mb-2">
                                                        <div className="text-xs uppercase font-bold tracking-wider mb-1">Graded</div>
                                                        <div className="font-black text-xl">{sub.score} <span className="text-sm text-emerald-500/70">/ {ass.maxScore}</span></div>
                                                    </div>
                                                ) : (
                                                    <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-sm font-semibold rounded-full border border-amber-500/20 mb-2">Pending Review</span>
                                                )}
                                                {sub.fileUrl && (
                                                    <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="flex items-center text-sm text-indigo-400 hover:underline">
                                                        <Paperclip className="w-4 h-4 mr-1" /> My Attachment
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="px-3 py-1 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-semibold rounded-full">Not Submitted</span>
                                        )}
                                    </div>
                                    {!sub && (
                                        <div className="mt-4 pt-4 border-t border-slate-800">
                                            {(ass.type === 'exam' || ass.type === 'test') && activeProctoringId !== ass.id ? (
                                                <button 
                                                    onClick={() => setActiveProctoringId(ass.id)}
                                                    className="w-full px-4 py-3 bg-amber-600 hover:bg-amber-500 text-slate-900 dark:text-white rounded-lg font-bold transition flex items-center justify-center"
                                                >
                                                    Start Monitored Session
                                                </button>
                                            ) : (
                                                <div className="space-y-4">
                                                    {(ass.type === 'exam' || ass.type === 'test') && activeProctoringId === ass.id && (
                                                        <ProctoringSession assessmentTitle={ass.title} onComplete={() => setActiveProctoringId(null)} />
                                                    )}
                                                    <div className="flex flex-col space-y-3">
                                                        {submissionFileUrl && (
                                                            <div className="flex items-center bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg">
                                                                <span className="text-xs text-slate-600 dark:text-slate-300 mr-auto truncate">Attached: Document</span>
                                                                <button onClick={() => setSubmissionFileUrl("")} className="p-1 hover:bg-slate-600 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white">
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                        <div className="flex space-x-3">
                                                            <FileUpload 
                                                                label=""
                                                                onUpload={(url) => setSubmissionFileUrl(url)}
                                                            />
                                                            <input 
                                                                type="text" 
                                                                value={submissionContent} 
                                                                onChange={(e) => setSubmissionContent(e.target.value)}
                                                                placeholder="Link to your work or text" 
                                                                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                            />
                                                            <button 
                                                                onClick={() => {
                                                                    handleSubmitAssessment(ass.id);
                                                                    setActiveProctoringId(null);
                                                                }}
                                                                disabled={(!submissionContent.trim() && !submissionFileUrl) || ((ass.type === 'exam' || ass.type === 'test') && activeProctoringId !== ass.id)}
                                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-slate-900 dark:text-white rounded-lg font-medium transition"
                                                            >
                                                                Submit
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }

    // Instructor / Org View
    return (
        <div className="space-y-8">
            <form onSubmit={handleCreateAssessment} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center"><Plus className="w-5 h-5 mr-2 text-indigo-400" /> Create New Assessment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Title</label>
                        <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="e.g. Midterm Exam" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Type</label>
                        <select value={type} onChange={e => setType(e.target.value as 'assignment' | 'test' | 'exam' | 'project')} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none">
                            <option value="assignment">Assignment</option>
                            <option value="test">Test</option>
                            <option value="exam">Exam</option>
                            <option value="project">Project</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Due Date</label>
                        <input required type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Max Score</label>
                        <input required type="number" min={1} value={maxScore} onChange={e => setMaxScore(Number(e.target.value))} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
                    </div>
                </div>
                {(type === 'assignment' || type === 'project') && (
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" id="isGroup" checked={isGroup} onChange={e => setIsGroup(e.target.checked)} className="w-4 h-4 text-indigo-600 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded focus:ring-indigo-500 focus:ring-offset-slate-900" />
                        <label htmlFor="isGroup" className="text-sm text-slate-600 dark:text-slate-300 font-medium">Group Assessment (Students can work in teams)</label>
                    </div>
                )}
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white rounded-lg font-bold transition w-full sm:w-auto">
                    Publish Assessment
                </button>
            </form>

            <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Manage Assessments</h3>
                {courseAssessments.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-800 text-slate-500 dark:text-slate-400">No assessments created yet.</div>
                ) : (
                    courseAssessments.map(ass => {
                        const subs = courseSubmissions.filter(s => s.assessmentId === ass.id);
                        const isGrading = selectedAssessmentId === ass.id;
                        
                        return (
                            <div key={ass.id} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                                            {ass.title}
                                            {ass.isGroup && <span className="ml-2 px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded-full border border-purple-500/20">Group</span>}
                                        </h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{ass.type} • Max: {ass.maxScore} pts • Due: {new Date(ass.dueDate).toLocaleDateString()}</p>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedAssessmentId(isGrading ? null : ass.id)}
                                        className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition"
                                    >
                                        {isGrading ? 'Close Submissions' : `View ${subs.length} Submissions`}
                                    </button>
                                </div>

                                {isGrading && (
                                    <div className="mt-4 pt-4 border-t border-slate-800">
                                        {subs.length === 0 ? (
                                            <p className="text-slate-500 text-sm italic">No submissions yet.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {subs.map(sub => {
                                                    const student = orgMembers.find(m => m.email === sub.userId || m.id === sub.userId) || { name: 'Unknown Student' };
                                                    return (
                                                        <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-lg">
                                                            <div className="mb-3 sm:mb-0">
                                                                <div className="font-semibold text-slate-900 dark:text-white">{student.name}</div>
                                                                <div className="text-sm text-indigo-400 truncate max-w-xs"><a href={sub.content} target="_blank" rel="noreferrer" className="hover:underline">{sub.content}</a></div>
                                                                {sub.fileUrl && (
                                                                    <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="flex items-center text-sm text-indigo-400 hover:underline mt-1">
                                                                        <Paperclip className="w-4 h-4 mr-1" /> View Attachment
                                                                    </a>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center space-x-3">
                                                                {sub.status === 'graded' ? (
                                                                    <div className="font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">{sub.score} / {ass.maxScore}</div>
                                                                ) : (
                                                                    <>
                                                                        <input 
                                                                            type="number" 
                                                                            max={ass.maxScore}
                                                                            value={gradingScores[sub.id] || ''}
                                                                            onChange={e => setGradingScores({...gradingScores, [sub.id]: Number(e.target.value)})}
                                                                            placeholder="Score"
                                                                            className="w-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-slate-900 dark:text-white outline-none focus:border-indigo-500 text-center"
                                                                        />
                                                                        <button 
                                                                            onClick={() => handleGradeSubmission(sub.id)}
                                                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-900 dark:text-white rounded text-sm font-bold transition"
                                                                        >
                                                                            Grade
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
}
