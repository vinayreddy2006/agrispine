import React, { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";
import Swal from "sweetalert2";
import { 
    AlertTriangle, Shield, CheckCircle, XCircle, Clock, 
    Trash2, RefreshCw, Eye, MessageSquare, AlertOctagon, User 
} from "lucide-react";

const AdminModeration = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedReport, setSelectedReport] = useState(null);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const url = statusFilter === "all" ? "/admin/reports" : `/admin/reports?status=${statusFilter}`;
            const { data } = await api.get(url);
            setReports(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load reports:", err);
            Swal.fire("Error", err.response?.data?.message || "Failed to load moderation reports", "error");
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleUpdateStatus = async (reportId, newStatus) => {
        try {
            await api.put(`/admin/reports/${reportId}/status`, { status: newStatus });
            Swal.fire({
                title: "Status Updated",
                text: `Report marked as ${newStatus.replace('_', ' ')}.`,
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });
            fetchReports();
            if (selectedReport && selectedReport._id === reportId) {
                setSelectedReport(prev => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            Swal.fire("Error", err.response?.data?.message || "Failed to update status", "error");
        }
    };

    const handleRemovePost = async (report) => {
        const result = await Swal.fire({
            title: "Remove Reported Post?",
            text: "This will permanently remove the post and its comments from the Community Feed.",
            icon: "warning",
            input: "text",
            inputLabel: "Moderation Reason / Action Notes",
            inputPlaceholder: "e.g., Inappropriate language / violates community policy",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete post",
            cancelButtonText: "Cancel",
            preConfirm: (notes) => {
                if (!notes || !notes.trim()) {
                    Swal.showValidationMessage("Please provide a brief reason for the audit log");
                }
                return notes;
            }
        });

        if (result.isConfirmed) {
            try {
                await api.post(`/admin/reports/${report._id}/action`, {
                    action: "delete_post",
                    notes: result.value
                });
                Swal.fire("Removed!", "The post has been removed and report resolved.", "success");
                fetchReports();
                if (selectedReport && selectedReport._id === report._id) {
                    setSelectedReport(null);
                }
            } catch (err) {
                Swal.fire("Error", err.response?.data?.message || "Failed to remove post", "error");
            }
        }
    };

    const handleDismiss = async (report) => {
        const result = await Swal.fire({
            title: "Dismiss Report?",
            text: "Mark this report as dismissed without removing the post.",
            icon: "question",
            input: "text",
            inputLabel: "Admin Notes (Optional)",
            inputPlaceholder: "e.g., Content complies with farming guidelines",
            showCancelButton: true,
            confirmButtonText: "Dismiss Report",
            cancelButtonText: "Cancel"
        });

        if (result.isConfirmed) {
            try {
                await api.post(`/admin/reports/${report._id}/action`, {
                    action: "dismiss",
                    notes: result.value || "Dismissed by admin"
                });
                Swal.fire("Dismissed", "The report has been marked as dismissed.", "success");
                fetchReports();
                if (selectedReport && selectedReport._id === report._id) {
                    setSelectedReport(null);
                }
            } catch (err) {
                Swal.fire("Error", err.response?.data?.message || "Failed to dismiss report", "error");
            }
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "pending":
                return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">Pending</span>;
            case "under_review":
                return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Under Review</span>;
            case "dismissed":
                return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Dismissed</span>;
            case "resolved":
                return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Resolved (Deleted)</span>;
            default:
                return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                        <Shield className="w-8 h-8 text-emerald-600" />
                        Community Moderation
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Review reported posts, inspect violations, and manage community safety.
                    </p>
                </div>

                <button
                    onClick={fetchReports}
                    disabled={loading}
                    className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                    { id: "all", label: "All Reports" },
                    { id: "pending", label: "Pending" },
                    { id: "under_review", label: "Under Review" },
                    { id: "resolved", label: "Resolved" },
                    { id: "dismissed", label: "Dismissed" }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setStatusFilter(tab.id)}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                            statusFilter === tab.id
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Reports Table / Content */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
                        Loading reported posts...
                    </div>
                ) : reports.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 space-y-2">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                        <h3 className="font-bold text-gray-800 dark:text-gray-200">No Reports Found</h3>
                        <p className="text-xs text-gray-400">
                            {statusFilter === "all"
                                ? "Great news! There are currently no reported posts to review."
                                : `No reports found with status "${statusFilter}".`}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                            <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                                <tr>
                                    <th className="px-6 py-4">Reported Post</th>
                                    <th className="px-6 py-4">Author</th>
                                    <th className="px-6 py-4">Reporter & Reason</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {reports.map((report) => (
                                    <tr key={report._id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition">
                                        {/* Post details */}
                                        <td className="px-6 py-4 max-w-xs">
                                            {report.post ? (
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white truncate">
                                                        {report.post.title || "Untitled Post"}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                                                        {report.post.content}
                                                    </p>
                                                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                                                        {report.post.category || "General"}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs italic text-gray-400">
                                                    Post has been deleted
                                                </span>
                                            )}
                                        </td>

                                        {/* Author */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-xs text-gray-700 dark:text-gray-300">
                                                    {report.postAuthor?.name ? report.postAuthor.name[0].toUpperCase() : "U"}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white text-xs">
                                                        {report.postAuthor?.name || "Unknown Author"}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400">
                                                        {report.postAuthor?.email || "No email"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Reporter & Reason */}
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                                    <span className="font-bold text-xs capitalize text-gray-800 dark:text-gray-200">
                                                        {report.reason ? report.reason.replace('_', ' ') : 'Violation'}
                                                    </span>
                                                </div>
                                                {report.description && (
                                                    <p className="text-xs text-gray-500 italic mt-0.5 max-w-xs">
                                                        "{report.description}"
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    By: {report.reporter?.name || "Farmer"} • {new Date(report.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            {getStatusBadge(report.status)}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* View Post Detail */}
                                                <button
                                                    onClick={() => setSelectedReport(report)}
                                                    className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>

                                                {/* Under Review */}
                                                {report.status === "pending" && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(report._id, "under_review")}
                                                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition"
                                                    >
                                                        Review
                                                    </button>
                                                )}

                                                {/* Dismiss */}
                                                {report.status !== "dismissed" && report.status !== "resolved" && (
                                                    <button
                                                        onClick={() => handleDismiss(report)}
                                                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                                    >
                                                        Dismiss
                                                    </button>
                                                )}

                                                {/* Delete Post */}
                                                {report.post && report.status !== "resolved" && (
                                                    <button
                                                        onClick={() => handleRemovePost(report)}
                                                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-xs transition"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        Remove Post
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedReport && (
                <div 
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
                    onClick={() => setSelectedReport(null)}
                >
                    <div 
                        className="bg-white dark:bg-gray-900 rounded-3xl max-w-xl w-full border border-gray-200 dark:border-gray-800 p-6 shadow-2xl space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b pb-3 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <AlertOctagon className="w-5 h-5 text-amber-500" />
                                Report Details
                            </h3>
                            <button 
                                onClick={() => setSelectedReport(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="text-xs font-bold uppercase text-gray-400 block">Report Reason</span>
                                <p className="font-semibold text-gray-800 dark:text-gray-200 capitalize">
                                    {selectedReport.reason?.replace('_', ' ')}
                                </p>
                                {selectedReport.description && (
                                    <p className="text-xs text-gray-500 italic mt-0.5">
                                        "{selectedReport.description}"
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t dark:border-gray-800">
                                <div>
                                    <span className="text-xs font-bold uppercase text-gray-400 block">Reporter</span>
                                    <p className="font-medium text-xs text-gray-800 dark:text-gray-200">
                                        {selectedReport.reporter?.name || "Anonymous"} ({selectedReport.reporter?.email || "No email"})
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold uppercase text-gray-400 block">Post Author</span>
                                    <p className="font-medium text-xs text-gray-800 dark:text-gray-200">
                                        {selectedReport.postAuthor?.name || "Unknown"} ({selectedReport.postAuthor?.email || "No email"})
                                    </p>
                                </div>
                            </div>

                            {selectedReport.post ? (
                                <div className="pt-2 border-t dark:border-gray-800">
                                    <span className="text-xs font-bold uppercase text-gray-400 block mb-1">Post Content</span>
                                    <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                        {selectedReport.post.title && (
                                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                                                {selectedReport.post.title}
                                            </h4>
                                        )}
                                        <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                            {selectedReport.post.content}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl text-xs text-red-600 dark:text-red-400">
                                    This post has already been removed.
                                </div>
                            )}

                            {selectedReport.adminAction?.action && (
                                <div className="pt-2 border-t dark:border-gray-800">
                                    <span className="text-xs font-bold uppercase text-gray-400 block">Admin Action Taken</span>
                                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">
                                        Action: <span className="font-bold capitalize">{selectedReport.adminAction.action.replace('_', ' ')}</span>
                                        {selectedReport.adminAction.notes && ` — "${selectedReport.adminAction.notes}"`}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-800">
                            {selectedReport.post && selectedReport.status !== "resolved" && (
                                <button
                                    onClick={() => handleRemovePost(selectedReport)}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Remove Post
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminModeration;

