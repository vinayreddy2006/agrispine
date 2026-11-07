import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Flag, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../../../utils/api';
import Swal from 'sweetalert2';

const REPORT_REASONS = [
    { id: 'Spam', label: 'Spam or Advertising', desc: 'Commercial promotions or unwanted repetitions' },
    { id: 'Inappropriate Content', label: 'Inappropriate Content', desc: 'Offensive, vulgar, or adult material' },
    { id: 'Misleading Agricultural Information', label: 'Misleading Agricultural Advice', desc: 'Unverified chemicals, wrong dosages, or harmful farming advice' },
    { id: 'Harassment or Abuse', label: 'Harassment or Abuse', desc: 'Hostile behavior, threats, or personal attacks' },
    { id: 'Fake or Suspicious Information', label: 'Fake or Suspicious Claims', desc: 'Impersonation or fraudulent schemes' },
    { id: 'Other', label: 'Other Issue', desc: 'Specify an issue not listed above' }
];

const ReportPostModal = ({ isOpen, onClose, postId, postTitle }) => {
    const { t } = useTranslation();
    const [selectedReason, setSelectedReason] = useState('Misleading Agricultural Information');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen || !postId) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedReason === 'Other' && !description.trim()) {
            Swal.fire('Explanation Required', 'Please provide an explanation for reporting this post.', 'info');
            return;
        }

        try {
            setSubmitting(true);
            const token = localStorage.getItem('token');
            const res = await api.post(`/community/report/${postId}`, {
                reason: selectedReason,
                description: description.trim()
            }, {
                headers: { 'auth-token': token }
            });

            Swal.fire({
                icon: 'success',
                title: 'Report Submitted',
                text: res.data?.message || 'Thank you. Our moderation team will review this post.',
                confirmButtonColor: '#059669'
            });

            setSelectedReason('Misleading Agricultural Information');
            setDescription('');
            onClose();

        } catch (err) {
            console.error('Report submission error:', err);
            const msg = err.response?.data?.message || 'Could not submit report. Please try again.';
            Swal.fire({
                icon: err.response?.status === 400 && msg.includes('already reported') ? 'info' : 'error',
                title: 'Report Status',
                text: msg
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-8"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-red-50/50 dark:bg-red-950/20">
                    <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400 font-bold">
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/60 flex items-center justify-center">
                            <Flag className="w-4 h-4 text-red-600" />
                        </div>
                        <span className="text-base text-slate-900 dark:text-white">Report Inappropriate Post</span>
                    </div>

                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {postTitle && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Reported Post</span>
                            <span className="font-semibold line-clamp-1">"{postTitle}"</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            Select Reason for Reporting
                        </label>
                        <div className="space-y-2">
                            {REPORT_REASONS.map((r) => {
                                const isSelected = selectedReason === r.id;
                                return (
                                    <label
                                        key={r.id}
                                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                                            isSelected
                                                ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="reportReason"
                                            value={r.id}
                                            checked={isSelected}
                                            onChange={() => setSelectedReason(r.id)}
                                            className="mt-1 text-red-600 focus:ring-red-500"
                                        />
                                        <div className="text-xs">
                                            <span className="font-bold text-slate-900 dark:text-white block">
                                                {r.label}
                                            </span>
                                            <span className="text-slate-500 dark:text-slate-400">
                                                {r.desc}
                                            </span>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Additional Explanation */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                            Additional Details {selectedReason === 'Other' ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal">(optional)</span>}
                        </label>
                        <textarea
                            rows={3}
                            placeholder={
                                selectedReason === 'Other'
                                    ? "Please describe the violation in detail..."
                                    : "Provide any additional context for community moderators..."
                            }
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none transition"
                        />
                    </div>

                    {/* Notice */}
                    <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                        <span>All reports are strictly reviewed by AgriSpine moderators. Posts are not deleted automatically.</span>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                        >
                            {t('common.cancel', 'Cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-600/20 disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    {t('common.loading', 'Submitting...')}
                                </>
                            ) : (
                                <>
                                    <Flag className="w-3.5 h-3.5" />
                                    {t('community_extra.report_post', 'Submit Report')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportPostModal;

