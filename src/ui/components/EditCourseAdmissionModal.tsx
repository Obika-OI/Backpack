import React, { useState } from 'react';
import { Course } from '../../types';
import { X, Check, Plus, ShieldCheck, FileText, Award, CreditCard, Layers } from 'lucide-react';

interface EditCourseAdmissionModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Course>) => Promise<void>;
}

export const EditCourseAdmissionModal: React.FC<EditCourseAdmissionModalProps> = ({
  course,
  isOpen,
  onClose,
  onSave
}) => {
  const [qualificationType, setQualificationType] = useState<Course['qualificationType']>(course.qualificationType || 'certificate');
  const [qualificationTitle, setQualificationTitle] = useState(course.qualificationTitle || '');
  const [requirements, setRequirements] = useState(course.requirements || '');
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>(
    course.requiredDocuments && course.requiredDocuments.length > 0
      ? course.requiredDocuments
      : ['Passport / National ID', 'Academic Transcript / High School Certificate']
  );
  const [newDocName, setNewDocName] = useState('');
  const [applicationProcess, setApplicationProcess] = useState(course.applicationProcess || '');
  const [instructorRequirements, setInstructorRequirements] = useState(course.instructorRequirements || '');
  const [paymentTermsAllowed, setPaymentTermsAllowed] = useState<Course['paymentTermsAllowed']>(course.paymentTermsAllowed || 'both');
  const [installmentInterval, setInstallmentInterval] = useState<Course['installmentInterval']>(course.installmentInterval || 'monthly');
  const [customMilestonesText, setCustomMilestonesText] = useState(course.customMilestonesText || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleAddDoc = () => {
    if (!newDocName.trim()) return;
    if (!requiredDocuments.includes(newDocName.trim())) {
      setRequiredDocuments([...requiredDocuments, newDocName.trim()]);
    }
    setNewDocName('');
  };

  const handleRemoveDoc = (docToRemove: string) => {
    setRequiredDocuments(requiredDocuments.filter(d => d !== docToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        qualificationType,
        qualificationTitle: qualificationTitle.trim() || undefined,
        requirements: requirements.trim(),
        requiredDocuments,
        applicationProcess: applicationProcess.trim(),
        instructorRequirements: instructorRequirements.trim(),
        paymentTermsAllowed,
        installmentInterval: paymentTermsAllowed !== 'one-time' ? installmentInterval : undefined,
        customMilestonesText: paymentTermsAllowed !== 'one-time' && installmentInterval === 'custom' ? customMilestonesText.trim() : undefined,
      });
      onClose();
    } catch (err) {
      console.error("Error updating course admission info:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Edit Course Admission Requirements & Guidelines</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure admission qualifications, required verification documents, guidelines, and payment options for <strong className="text-slate-700 dark:text-slate-200">{course.title}</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Qualification */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              <span>1. Program & Qualification Award</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Qualification Level / Type
                </label>
                <select
                  value={qualificationType || 'certificate'}
                  onChange={e => setQualificationType(e.target.value as Course['qualificationType'])}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="certificate">Certificate of Completion</option>
                  <option value="diploma">Diploma / Advanced Diploma</option>
                  <option value="bachelors">Bachelor's Degree (B.Sc / B.A / B.Tech)</option>
                  <option value="masters">Master's Degree (M.Sc / M.A / MBA)</option>
                  <option value="doctorate">Doctorate / Ph.D</option>
                  <option value="professional">Professional Certification</option>
                  <option value="other">Other Award</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Qualification Award Title
                </label>
                <input
                  type="text"
                  value={qualificationTitle || ''}
                  onChange={e => setQualificationTitle(e.target.value)}
                  placeholder="e.g. Bachelor of Science in Software Engineering"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Student Admission Guidelines */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>2. Student Admission Guidelines & Prerequisites</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Admission Prerequisites & Criteria (One per line)
              </label>
              <textarea
                rows={4}
                value={requirements || ''}
                onChange={e => setRequirements(e.target.value)}
                placeholder="e.g.&#10;• Minimum High School Diploma or Equivalent&#10;• Basic familiarity with computer operations&#10;• Passing score in entrance evaluation test"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Section 3: Required Verification Documents */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>3. Required Verification Documents for Applicants</span>
            </h3>

            <div className="flex flex-wrap gap-2 mb-2">
              {requiredDocuments.map((docName, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 rounded-lg group shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                  {docName}
                  <button
                    type="button"
                    onClick={() => handleRemoveDoc(docName)}
                    className="ml-2 text-slate-400 hover:text-red-500 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newDocName || ''}
                onChange={e => setNewDocName(e.target.value)}
                placeholder="Add document type (e.g., Medical Fitness Certificate, CV/Resume)"
                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddDoc}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </button>
            </div>
          </div>

          {/* Section 4: Application & Enrollment Procedure */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>4. Application & Enrollment Procedure</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Step-by-Step Enrollment Steps (One per line)
              </label>
              <textarea
                rows={3}
                value={applicationProcess || ''}
                onChange={e => setApplicationProcess(e.target.value)}
                placeholder="e.g.&#10;1. Submit initial application form and verification documents&#10;2. Await verification and admission clearance from admissions office&#10;3. Complete tuition fee payment or installment setup"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Section 5: Instructor Qualifications */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>5. Instructor Standards & Requirements</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Instructor Qualifications & Accreditation Criteria
              </label>
              <textarea
                rows={3}
                value={instructorRequirements || ''}
                onChange={e => setInstructorRequirements(e.target.value)}
                placeholder="e.g.&#10;• Minimum 3 years industry experience or relevant degree&#10;• Institutional accreditation and pedagogical certification"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Section 6: Payment Terms Allowed */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" />
              <span>6. Payment Options & Installment Structure</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Allowed Payment Terms
                </label>
                <select
                  value={paymentTermsAllowed || 'both'}
                  onChange={e => setPaymentTermsAllowed(e.target.value as Course['paymentTermsAllowed'])}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="both">Both One-Time Payment & Installments Allowed</option>
                  <option value="installment">Installment Payment Only</option>
                  <option value="one-time">One-Time Full Payment Only</option>
                </select>
              </div>

              {paymentTermsAllowed !== 'one-time' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Installment Interval
                  </label>
                  <select
                    value={installmentInterval || 'monthly'}
                    onChange={e => setInstallmentInterval(e.target.value as Course['installmentInterval'])}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="monthly">Monthly Breakdown</option>
                    <option value="weekly">Weekly Breakdown</option>
                    <option value="custom">Custom Milestones</option>
                  </select>
                </div>
              )}
            </div>

            {paymentTermsAllowed !== 'one-time' && installmentInterval === 'custom' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Custom Milestone Installment Rules
                </label>
                <input
                  type="text"
                  value={customMilestonesText || ''}
                  onChange={e => setCustomMilestonesText(e.target.value)}
                  placeholder="e.g. 40% initial deposit on enrollment, 30% mid-semester, 30% before final exams"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center shadow-md disabled:opacity-50"
            >
              <Check className="w-4 h-4 mr-1.5" />
              <span>{isSaving ? "Saving Changes..." : "Save Admission Guidelines"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
