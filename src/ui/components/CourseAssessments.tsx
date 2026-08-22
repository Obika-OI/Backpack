import React, { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { Assessment, AssessmentQuestion, QuestionType, Submission, QuestionAnswer } from '../../types';
import { 
  Award, Plus, Paperclip, X, Check, FileText, 
  Clock, Trash2
} from 'lucide-react';
import { ProctoringSession } from './ProctoringSession';
import { FileUpload } from './FileUpload';
import { generateId } from '../../lib/id';

export const CourseAssessments = ({ courseId, isStudent }: { courseId: string; isStudent: boolean }) => {
  const { assessments, submissions, addAssessment, addSubmission, updateSubmissionScore, orgMembers } = useAppContext();
  const { currentUser } = useAuth();

  const courseAssessments = assessments.filter(a => a.courseId === courseId);
  const courseSubmissions = submissions.filter(s => s.courseId === courseId);

  // Instructor creation state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<'assignment' | 'test' | 'exam' | 'project'>('assignment');
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | undefined>(undefined);
  const [projectBriefUrl, setProjectBriefUrl] = useState("");
  const [projectBriefName, setProjectBriefName] = useState("");

  // Questions builder state
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Partial<AssessmentQuestion>>({
    type: 'mcq',
    prompt: '',
    points: 10,
    options: ['', ''],
    correctOptionIndex: 0,
    acceptableAnswers: [''],
    rubricGuidelines: '',
    allowFileUpload: true
  });

  // Student taking assessment state
  const [activeTakingAssessmentId, setActiveTakingAssessmentId] = useState<string | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [globalFileUrl, setGlobalFileUrl] = useState("");
  const [globalFileName, setGlobalFileName] = useState("");
  const [globalContent, setGlobalContent] = useState("");
  const [activeProctoringId, setActiveProctoringId] = useState<string | null>(null);

  // Instructor grading state
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [activeGradingSubmission, setActiveGradingSubmission] = useState<Submission | null>(null);
  const [gradingQuestionScores, setGradingQuestionScores] = useState<Record<string, number>>({});
  const [gradingFeedback, setGradingFeedback] = useState("");

  // Question builder helpers
  const handleAddQuestion = () => {
    if (!editingQuestion.prompt?.trim()) {
      alert("Please enter a question prompt.");
      return;
    }

    const qId = generateId('q');
    const newQ: AssessmentQuestion = {
      id: qId,
      type: editingQuestion.type as QuestionType || 'mcq',
      prompt: editingQuestion.prompt.trim(),
      points: Number(editingQuestion.points) || 10,
      options: editingQuestion.type === 'mcq' ? (editingQuestion.options || []).filter(o => o.trim() !== '') : undefined,
      correctOptionIndex: editingQuestion.type === 'mcq' ? (editingQuestion.correctOptionIndex || 0) : undefined,
      acceptableAnswers: editingQuestion.type === 'short_answer' ? (editingQuestion.acceptableAnswers || []).filter(a => a.trim() !== '') : undefined,
      rubricGuidelines: (editingQuestion.type === 'long_answer' || editingQuestion.type === 'project') ? editingQuestion.rubricGuidelines?.trim() : undefined,
      attachmentUrl: editingQuestion.attachmentUrl,
      attachmentName: editingQuestion.attachmentName,
      allowFileUpload: editingQuestion.allowFileUpload
    };

    setQuestions(prev => [...prev, newQ]);

    // Reset question form
    setEditingQuestion({
      type: 'mcq',
      prompt: '',
      points: 10,
      options: ['', ''],
      correctOptionIndex: 0,
      acceptableAnswers: [''],
      rubricGuidelines: '',
      allowFileUpload: true
    });
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedMaxScore = questions.reduce((acc, q) => acc + q.points, 0);
    const finalMaxScore = calculatedMaxScore > 0 ? calculatedMaxScore : 100;

    const newAssessment: Assessment = {
      id: generateId('ass'),
      courseId,
      title,
      type,
      description,
      instructions,
      dueDate,
      maxScore: finalMaxScore,
      isGroup,
      timeLimitMinutes,
      questions,
      projectBriefUrl,
      projectBriefName,
      createdAt: new Date().toISOString()
    };

    await addAssessment(newAssessment);

    // Reset create form
    setTitle("");
    setType('assignment');
    setDescription("");
    setInstructions("");
    setDueDate("");
    setIsGroup(false);
    setTimeLimitMinutes(undefined);
    setProjectBriefUrl("");
    setProjectBriefName("");
    setQuestions([]);
    setShowCreateForm(false);
  };

  // Student submission handler with auto-grading
  const handleSubmitAssessment = async (assessment: Assessment) => {
    if (!currentUser) return;

    let autoTotal = 0;
    const finalAnswers: QuestionAnswer[] = [];

    if (assessment.questions && assessment.questions.length > 0) {
      assessment.questions.forEach(q => {
        const studentAns = studentAnswers[q.id] || { questionId: q.id, type: q.type };
        let pointsEarned = 0;
        let isAutoMarked = false;

        if (q.type === 'mcq') {
          isAutoMarked = true;
          if (studentAns.selectedOptionIndex !== undefined && studentAns.selectedOptionIndex === q.correctOptionIndex) {
            pointsEarned = q.points;
          }
        } else if (q.type === 'short_answer') {
          isAutoMarked = true;
          const givenText = (studentAns.textAnswer || '').trim().toLowerCase();
          const matches = (q.acceptableAnswers || []).some(ans => ans.trim().toLowerCase() === givenText);
          if (givenText && matches) {
            pointsEarned = q.points;
          }
        }

        if (isAutoMarked) {
          autoTotal += pointsEarned;
        }

        finalAnswers.push({
          ...studentAns,
          questionId: q.id,
          type: q.type,
          autoScore: isAutoMarked ? pointsEarned : 0,
          finalScore: isAutoMarked ? pointsEarned : undefined,
          isAutoMarked
        });
      });
    }

    const submission: Submission = {
      id: generateId('sub'),
      assessmentId: assessment.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      courseId,
      submittedAt: new Date().toISOString(),
      content: globalContent,
      fileUrl: globalFileUrl,
      fileName: globalFileName,
      answers: finalAnswers,
      autoScore: autoTotal,
      score: autoTotal,
      status: 'submitted'
    };

    await addSubmission(submission);

    // Reset student taking state
    setActiveTakingAssessmentId(null);
    setStudentAnswers({});
    setGlobalContent("");
    setGlobalFileUrl("");
    setGlobalFileName("");
    setActiveProctoringId(null);
  };

  // Instructor manual grading handler
  const handleSaveGrading = async () => {
    if (!activeGradingSubmission) return;

    let totalScore = 0;

    const updatedAnswers = (activeGradingSubmission.answers || []).map(ans => {
      const manualScoreForQ = gradingQuestionScores[ans.questionId] !== undefined 
        ? gradingQuestionScores[ans.questionId] 
        : (ans.finalScore ?? ans.autoScore ?? 0);
      
      totalScore += manualScoreForQ;
      return {
        ...ans,
        manualScore: manualScoreForQ,
        finalScore: manualScoreForQ
      };
    });

    // If assessment had no structured questions, use fallback top-level score
    if (!activeGradingSubmission.answers || activeGradingSubmission.answers.length === 0) {
      totalScore = gradingQuestionScores['_topLevel'] || 0;
    }

    await updateSubmissionScore(
      activeGradingSubmission.id, 
      totalScore, 
      gradingFeedback || "Graded by instructor",
      updatedAnswers,
      totalScore
    );

    setActiveGradingSubmission(null);
    setGradingQuestionScores({});
    setGradingFeedback("");
  };

  if (isStudent) {
    const mySubmissions = courseSubmissions.filter(s => s.userId === currentUser?.id);
    const totalScore = mySubmissions.reduce((acc, sub) => acc + (sub.score || 0), 0);
    const totalMaxScore = courseAssessments.reduce((acc, ass) => acc + ass.maxScore, 0);
    const gpa = totalMaxScore > 0 ? ((totalScore / totalMaxScore) * 4.0).toFixed(2) : "N/A";

    return (
      <div className="space-y-6">
        {/* Transcript Overview */}
        <div className="bg-indigo-900/40 p-6 rounded-2xl border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 flex items-center">
              <Award className="w-5 h-5 mr-2 text-amber-400" /> Academic Transcript & Assessments
            </h3>
            <p className="text-sm text-indigo-200">
              Complete tests, answer structured questions, submit projects, and track live scores.
            </p>
          </div>
          <div className="text-left md:text-right bg-indigo-950/60 p-3.5 rounded-xl border border-indigo-800/60">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {totalScore} <span className="text-sm text-indigo-300 font-medium">/ {totalMaxScore} PTS</span>
            </div>
            <div className="text-xs font-semibold text-emerald-400 mt-1">
              GPA Equivalent: {gpa}
            </div>
          </div>
        </div>

        {/* Assessment Cards */}
        <div className="space-y-4">
          {courseAssessments.length === 0 ? (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
              No assessments scheduled yet.
            </div>
          ) : (
            courseAssessments.map(ass => {
              const sub = mySubmissions.find(s => s.assessmentId === ass.id);
              const isTaking = activeTakingAssessmentId === ass.id;

              return (
                <div key={ass.id} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 transition">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-lg text-slate-900 dark:text-white">{ass.title}</h4>
                        <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold uppercase rounded-full border border-indigo-500/20">
                          {ass.type}
                        </span>
                        {ass.isGroup && (
                          <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-full border border-purple-500/20">
                            Group Project
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span>Due: {ass.dueDate ? new Date(ass.dueDate).toLocaleDateString() : 'No deadline'}</span>
                        <span>•</span>
                        <span>Max Score: <strong>{ass.maxScore} pts</strong></span>
                        {ass.timeLimitMinutes && (
                          <>
                            <span>•</span>
                            <span className="flex items-center text-amber-600 dark:text-amber-400 font-semibold">
                              <Clock className="w-3.5 h-3.5 mr-1" /> {ass.timeLimitMinutes} Mins
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Submission status badge */}
                    {sub ? (
                      <div className="flex items-center space-x-3">
                        {sub.status === 'graded' ? (
                          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-center">
                            <div className="text-[10px] uppercase font-extrabold tracking-wider">Graded Result</div>
                            <div className="font-black text-xl">{sub.score} <span className="text-xs text-emerald-500/80">/ {ass.maxScore}</span></div>
                          </div>
                        ) : (
                          <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl text-center">
                            <div className="text-[10px] uppercase font-extrabold tracking-wider">Auto-marked / Pending</div>
                            <div className="font-black text-lg">{sub.autoScore || 0} <span className="text-xs text-amber-500/80">pts auto-scored</span></div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveTakingAssessmentId(isTaking ? null : ass.id)}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition shadow-sm self-start md:self-auto"
                      >
                        {isTaking ? 'Close Assessment' : 'Start / Take Assessment'}
                      </button>
                    )}
                  </div>

                  {/* Description & Instructions */}
                  {(ass.description || ass.instructions || ass.projectBriefUrl) && (
                    <div className="mb-4 p-4 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      {ass.description && <p className="font-medium text-slate-800 dark:text-slate-200">{ass.description}</p>}
                      {ass.instructions && <p className="italic text-slate-500 dark:text-slate-400">Instructions: {ass.instructions}</p>}
                      {ass.projectBriefUrl && (
                        <a
                          href={ass.projectBriefUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-bold hover:underline mt-1"
                        >
                          <Paperclip className="w-3.5 h-3.5 mr-1" /> Download Project Brief ({ass.projectBriefName || 'Attachment'})
                        </a>
                      )}
                    </div>
                  )}

                  {/* Active Taking View */}
                  {isTaking && !sub && (
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6 animate-in fade-in">
                      {(ass.type === 'exam' || ass.type === 'test') && activeProctoringId !== ass.id && (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                          <div className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                            <strong className="block font-bold">Monitored Proctoring Required</strong>
                            This test or exam uses live proctoring checks. Start the session to unlock answer inputs.
                          </div>
                          <button
                            onClick={() => setActiveProctoringId(ass.id)}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition"
                          >
                            Start Monitored Session
                          </button>
                        </div>
                      )}

                      {((ass.type !== 'exam' && ass.type !== 'test') || activeProctoringId === ass.id) && (
                        <>
                          {activeProctoringId === ass.id && (
                            <ProctoringSession assessmentTitle={ass.title} onComplete={() => {}} />
                          )}

                          {/* Questions List */}
                          {ass.questions && ass.questions.length > 0 ? (
                            <div className="space-y-6">
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                                Answer Assessment Questions ({ass.questions.length})
                              </h5>
                              {ass.questions.map((q, qIndex) => {
                                const currentAns = studentAnswers[q.id] || { questionId: q.id, type: q.type };

                                return (
                                  <div key={q.id} className="p-5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                                          Question {qIndex + 1} • {q.points} PTS ({q.type.replace('_', ' ').toUpperCase()})
                                        </span>
                                        <h6 className="font-bold text-slate-900 dark:text-white text-sm">{q.prompt}</h6>
                                      </div>
                                    </div>

                                    {/* MCQ options */}
                                    {q.type === 'mcq' && q.options && (
                                      <div className="space-y-2 pl-1">
                                        {q.options.map((opt, optIdx) => (
                                          <label
                                            key={optIdx}
                                            className={`flex items-center space-x-3 p-3 rounded-lg border text-xs font-medium transition cursor-pointer ${
                                              currentAns.selectedOptionIndex === optIdx
                                                ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-bold'
                                                : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                                            }`}
                                          >
                                            <input
                                              type="radio"
                                              name={`q_${q.id}`}
                                              checked={currentAns.selectedOptionIndex === optIdx}
                                              onChange={() => {
                                                setStudentAnswers(prev => ({
                                                  ...prev,
                                                  [q.id]: { ...currentAns, selectedOptionIndex: optIdx }
                                                }));
                                              }}
                                              className="text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span><strong>{String.fromCharCode(65 + optIdx)}.</strong> {opt}</span>
                                          </label>
                                        ))}
                                      </div>
                                    )}

                                    {/* Short Answer text */}
                                    {q.type === 'short_answer' && (
                                      <div>
                                        <input
                                          type="text"
                                          value={currentAns.textAnswer || ''}
                                          onChange={e => {
                                            setStudentAnswers(prev => ({
                                              ...prev,
                                              [q.id]: { ...currentAns, textAnswer: e.target.value }
                                            }));
                                          }}
                                          placeholder="Type your exact answer here..."
                                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                      </div>
                                    )}

                                    {/* Long Answer text */}
                                    {q.type === 'long_answer' && (
                                      <div>
                                        <textarea
                                          rows={4}
                                          value={currentAns.textAnswer || ''}
                                          onChange={e => {
                                            setStudentAnswers(prev => ({
                                              ...prev,
                                              [q.id]: { ...currentAns, textAnswer: e.target.value }
                                            }));
                                          }}
                                          placeholder="Write your comprehensive response..."
                                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                      </div>
                                    )}

                                    {/* Project / File upload */}
                                    {q.type === 'project' && (
                                      <div className="space-y-3">
                                        {q.rubricGuidelines && (
                                          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-xs text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                            <strong>Rubric / Instructions:</strong> {q.rubricGuidelines}
                                          </div>
                                        )}
                                        <textarea
                                          rows={3}
                                          value={currentAns.textAnswer || ''}
                                          onChange={e => {
                                            setStudentAnswers(prev => ({
                                              ...prev,
                                              [q.id]: { ...currentAns, textAnswer: e.target.value }
                                            }));
                                          }}
                                          placeholder="Project description or notes..."
                                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}

                          {/* Top-Level File / Document Upload */}
                          <div className="p-5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                              <Paperclip className="w-4 h-4 mr-2 text-indigo-500" /> Upload Deliverable or Link (Optional)
                            </h5>

                            {globalFileUrl && (
                              <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400">
                                <span className="font-semibold truncate">Attached: {globalFileName || 'Document'}</span>
                                <button onClick={() => { setGlobalFileUrl(""); setGlobalFileName(""); }} className="p-1 text-slate-400 hover:text-white">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FileUpload
                                label="Upload File / Document"
                                onUpload={(url, filename) => {
                                  setGlobalFileUrl(url);
                                  if (filename) setGlobalFileName(filename);
                                }}
                              />
                              <input
                                type="text"
                                value={globalContent}
                                onChange={e => setGlobalContent(e.target.value)}
                                placeholder="Repository link, Google Doc URL, or general notes..."
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => handleSubmitAssessment(ass)}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition shadow-md flex items-center justify-center space-x-2"
                          >
                            <Check className="w-5 h-5" />
                            <span>Submit Complete Assessment Answers</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Submitted Review */}
                  {sub && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <div className="p-4 bg-white dark:bg-slate-800/50 rounded-xl text-xs space-y-3">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                          <span>Submitted on: {new Date(sub.submittedAt).toLocaleString()}</span>
                          {sub.fileUrl && (
                            <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center">
                              <Paperclip className="w-3.5 h-3.5 mr-1" /> View Uploaded Work
                            </a>
                          )}
                        </div>
                        {sub.feedback && (
                          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200">
                            <strong>Instructor Feedback:</strong> {sub.feedback}
                          </div>
                        )}
                      </div>
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

  // Instructor / Organization View
  return (
    <div className="space-y-8">
      {/* Create Assessment Button / Form */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
              <Plus className="w-5 h-5 mr-2 text-indigo-400" /> Create & Configure Assessment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Build assignments, exams, tests, or project briefs with automatic marking for MCQs/short answers and rubric guidelines for long answers/projects.
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center"
          >
            {showCreateForm ? 'Cancel Creation' : '+ New Assessment'}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateAssessment} className="space-y-6 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Title</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Module 3 Midterm Exam"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Assessment Category</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as 'assignment' | 'test' | 'exam' | 'project')}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="assignment">Assignment</option>
                  <option value="test">Test</option>
                  <option value="exam">Exam</option>
                  <option value="project">Project / Practical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Due Date</label>
                <input
                  required
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Description / Summary</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Brief summary of topics covered..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Time Limit in Minutes (Optional)</label>
                <input
                  type="number"
                  value={timeLimitMinutes || ''}
                  onChange={e => setTimeLimitMinutes(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. 60 for timed exams"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Instructions for Students</label>
              <textarea
                rows={2}
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Important submission instructions, academic honesty policies, or guidelines..."
              />
            </div>

            {/* Project / Brief Upload */}
            <div className="p-4 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center">
                <Paperclip className="w-4 h-4 mr-1.5 text-indigo-500" /> Upload Project Brief / Question Document (Optional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileUpload
                  label="Upload Brief Document"
                  onUpload={(url, name) => {
                    setProjectBriefUrl(url);
                    if (name) setProjectBriefName(name);
                  }}
                />
                {projectBriefUrl && (
                  <div className="flex items-center justify-between p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300">
                    <span className="truncate font-semibold">{projectBriefName || 'Uploaded Brief'}</span>
                    <button type="button" onClick={() => { setProjectBriefUrl(""); setProjectBriefName(""); }} className="p-1 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* QUESTION BUILDER SECTION */}
            <div className="p-5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-indigo-500" /> Question Builder ({questions.length} Added)
                </h4>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Total Points: {questions.reduce((acc, q) => acc + q.points, 0)} PTS
                </span>
              </div>

              {/* Added Questions List */}
              {questions.length > 0 && (
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold uppercase rounded">
                            Q{idx + 1} • {q.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{q.points} PTS</span>
                          {q.type === 'mcq' && <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-1.5 py-0.5 rounded">Auto-Marked</span>}
                          {q.type === 'short_answer' && <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-1.5 py-0.5 rounded">Auto-Marked</span>}
                        </div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white">{q.prompt}</p>
                        {q.options && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 space-x-2">
                            <span>Options: {q.options.join(' | ')}</span>
                            <span className="text-emerald-500 font-semibold">(Correct: {q.options[q.correctOptionIndex || 0]})</span>
                          </div>
                        )}
                        {q.acceptableAnswers && (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                            Acceptable Answers: {q.acceptableAnswers.join(', ')}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Question Input Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-4">
                <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Add Question Item
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Question Prompt</label>
                    <input
                      type="text"
                      value={editingQuestion.prompt || ''}
                      onChange={e => setEditingQuestion({ ...editingQuestion, prompt: e.target.value })}
                      placeholder="e.g. What is the main function of the mitochondrial matrix?"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Question Type</label>
                    <select
                      value={editingQuestion.type || 'mcq'}
                      onChange={e => setEditingQuestion({ ...editingQuestion, type: e.target.value as QuestionType })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="mcq">Multiple Choice (MCQ)</option>
                      <option value="short_answer">Short Answer (Auto-Marked)</option>
                      <option value="long_answer">Long Answer / Essay (Manual)</option>
                      <option value="project">Project / File Deliverable (Manual)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Points / Score Weight</label>
                    <input
                      type="number"
                      min={1}
                      value={editingQuestion.points || 10}
                      onChange={e => setEditingQuestion({ ...editingQuestion, points: Number(e.target.value) })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* MCQ configuration */}
                {editingQuestion.type === 'mcq' && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Options & Correct Answer Selection
                    </label>
                    {(editingQuestion.options || []).map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="correct_opt_selector"
                          checked={editingQuestion.correctOptionIndex === oIdx}
                          onChange={() => setEditingQuestion({ ...editingQuestion, correctOptionIndex: oIdx })}
                          title="Set as correct answer"
                        />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 w-5">{String.fromCharCode(65 + oIdx)}.</span>
                        <input
                          type="text"
                          value={opt}
                          onChange={e => {
                            const newOpts = [...(editingQuestion.options || [])];
                            newOpts[oIdx] = e.target.value;
                            setEditingQuestion({ ...editingQuestion, options: newOpts });
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + oIdx)}...`}
                          className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEditingQuestion({ ...editingQuestion, options: [...(editingQuestion.options || []), ''] })}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
                    >
                      + Add Option
                    </button>
                  </div>
                )}

                {/* Short Answer configuration */}
                {editingQuestion.type === 'short_answer' && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Acceptable Answer Variations (Comma-Separated for Auto-Marking)
                    </label>
                    <input
                      type="text"
                      value={(editingQuestion.acceptableAnswers || []).join(', ')}
                      onChange={e => setEditingQuestion({
                        ...editingQuestion,
                        acceptableAnswers: e.target.value.split(',').map(s => s.trim())
                      })}
                      placeholder="e.g. Mitochondria, mitochondria, power house"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                )}

                {/* Long Answer / Project configuration */}
                {(editingQuestion.type === 'long_answer' || editingQuestion.type === 'project') && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Rubric Guidelines / Grading Key
                    </label>
                    <textarea
                      rows={2}
                      value={editingQuestion.rubricGuidelines || ''}
                      onChange={e => setEditingQuestion({ ...editingQuestion, rubricGuidelines: e.target.value })}
                      placeholder="Guidance for evaluating essay / project submissions..."
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Question to Assessment
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition shadow-md"
            >
              Publish & Save Complete Assessment
            </button>
          </form>
        )}
      </div>

      {/* List of Created Assessments */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Course Assessments & Student Submissions</h3>
        {courseAssessments.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
            No assessments created yet.
          </div>
        ) : (
          courseAssessments.map(ass => {
            const subs = courseSubmissions.filter(s => s.assessmentId === ass.id);
            const isGradingList = selectedAssessmentId === ass.id;

            return (
              <div key={ass.id} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 transition">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white">{ass.title}</h4>
                      <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold uppercase rounded-full">
                        {ass.type}
                      </span>
                      {ass.questions && ass.questions.length > 0 && (
                        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">
                          {ass.questions.length} Questions
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Max Score: <strong>{ass.maxScore} pts</strong> • Due: {ass.dueDate ? new Date(ass.dueDate).toLocaleDateString() : 'No limit'}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedAssessmentId(isGradingList ? null : ass.id)}
                    className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold transition border border-slate-200 dark:border-slate-700"
                  >
                    {isGradingList ? 'Hide Submissions' : `View ${subs.length} Submissions`}
                  </button>
                </div>

                {/* Submissions List & Detailed Grading */}
                {isGradingList && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in">
                    {subs.length === 0 ? (
                      <p className="text-slate-500 text-xs italic">No student submissions recorded for this assessment yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {subs.map(sub => {
                          const student = orgMembers.find(m => m.email?.toLowerCase() === sub.userEmail?.toLowerCase() || m.id === sub.userId) || {
                            name: sub.userName || 'Student',
                            email: sub.userEmail || sub.userId
                          };

                          const isDetailedGrading = activeGradingSubmission?.id === sub.id;

                          return (
                            <div key={sub.id} className="p-4 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white text-sm">{student.name}</div>
                                  <div className="text-xs text-slate-500">{student.email} • Submitted {new Date(sub.submittedAt).toLocaleString()}</div>
                                </div>

                                <div className="flex items-center space-x-3">
                                  {sub.status === 'graded' ? (
                                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs rounded-lg">
                                      Graded: {sub.score} / {ass.maxScore} PTS
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold text-xs rounded-lg">
                                      Auto-scored: {sub.autoScore || 0} PTS (Needs Grading)
                                    </span>
                                  )}

                                  <button
                                    onClick={() => {
                                      if (isDetailedGrading) {
                                        setActiveGradingSubmission(null);
                                      } else {
                                        setActiveGradingSubmission(sub);
                                        const initialScores: Record<string, number> = {};
                                        (sub.answers || []).forEach(a => {
                                          initialScores[a.questionId] = a.finalScore ?? a.autoScore ?? 0;
                                        });
                                        if (!sub.answers || sub.answers.length === 0) {
                                          initialScores['_topLevel'] = sub.score || 0;
                                        }
                                        setGradingQuestionScores(initialScores);
                                        setGradingFeedback(sub.feedback || "");
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition"
                                  >
                                    {isDetailedGrading ? 'Close Panel' : 'Grade / Review Answers'}
                                  </button>
                                </div>
                              </div>

                              {/* Detailed Grading View per Submission */}
                              {isDetailedGrading && (
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/80 space-y-5 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl">
                                  <h5 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                                    Student Answer Evaluation & Score Input
                                  </h5>

                                  {/* Render questions evaluation */}
                                  {ass.questions && ass.questions.length > 0 ? (
                                    <div className="space-y-4">
                                      {ass.questions.map((q, qIdx) => {
                                        const ans = (sub.answers || []).find(a => a.questionId === q.id);
                                        const currentScore = gradingQuestionScores[q.id] !== undefined 
                                          ? gradingQuestionScores[q.id] 
                                          : (ans?.finalScore ?? ans?.autoScore ?? 0);

                                        return (
                                          <div key={q.id} className="p-3.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                                            <div className="flex justify-between items-start">
                                              <div>
                                                <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase">
                                                  Q{qIdx + 1} ({q.type.replace('_', ' ')}) • Max {q.points} PTS
                                                </span>
                                                <p className="font-bold text-xs text-slate-900 dark:text-white">{q.prompt}</p>
                                              </div>
                                              <div className="flex items-center space-x-1.5">
                                                <label className="text-[10px] font-bold text-slate-500">Score:</label>
                                                <input
                                                  type="number"
                                                  max={q.points}
                                                  min={0}
                                                  value={currentScore}
                                                  onChange={e => setGradingQuestionScores({
                                                    ...gradingQuestionScores,
                                                    [q.id]: Number(e.target.value)
                                                  })}
                                                  className="w-16 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-center text-xs font-bold text-slate-900 dark:text-white"
                                                />
                                              </div>
                                            </div>

                                            {/* Student response details */}
                                            {q.type === 'mcq' && (
                                              <div className="text-xs text-slate-600 dark:text-slate-300">
                                                <span>Selected Option: <strong>{ans?.selectedOptionIndex !== undefined ? q.options?.[ans.selectedOptionIndex] : 'None'}</strong></span>
                                                <span className="ml-3 text-emerald-600 font-semibold">(Correct: {q.options?.[q.correctOptionIndex || 0]})</span>
                                              </div>
                                            )}

                                            {(q.type === 'short_answer' || q.type === 'long_answer' || q.type === 'project') && (
                                              <div className="text-xs text-slate-800 dark:text-slate-200 p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                                                <strong>Student Response:</strong> {ans?.textAnswer || sub.content || 'No text submitted'}
                                              </div>
                                            )}

                                            {q.rubricGuidelines && (
                                              <div className="text-[11px] text-indigo-700 dark:text-indigo-300 italic">
                                                Rubric: {q.rubricGuidelines}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      <div className="text-xs text-slate-700 dark:text-slate-300 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <strong>Submission Text/Link:</strong> {sub.content || 'None'}
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Grade Score:</label>
                                        <input
                                          type="number"
                                          max={ass.maxScore}
                                          min={0}
                                          value={gradingQuestionScores['_topLevel'] ?? (sub.score || 0)}
                                          onChange={e => setGradingQuestionScores({ ...gradingQuestionScores, '_topLevel': Number(e.target.value) })}
                                          className="w-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-xs font-bold text-slate-900 dark:text-white"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Submittable file preview */}
                                  {sub.fileUrl && (
                                    <div className="flex items-center space-x-2">
                                      <a
                                        href={sub.fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                                      >
                                        <Paperclip className="w-3.5 h-3.5 mr-1" /> Open Attached File / Project ({sub.fileName || 'Attachment'})
                                      </a>
                                    </div>
                                  )}

                                  {/* Feedback textarea */}
                                  <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                      Overall Instructor Feedback
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={gradingFeedback}
                                      onChange={e => setGradingFeedback(e.target.value)}
                                      placeholder="Provide constructive feedback for the student..."
                                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                                    />
                                  </div>

                                  <button
                                    onClick={handleSaveGrading}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center space-x-1"
                                  >
                                    <Check className="w-4 h-4" />
                                    <span>Save & Finalize Student Grade</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
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
};
