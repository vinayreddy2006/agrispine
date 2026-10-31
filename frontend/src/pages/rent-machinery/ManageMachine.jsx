import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../utils/api";
import Swal from "sweetalert2";
import { 
    Trash2, Check, X, Calendar, User, Phone, MessageSquare, 
    CheckCircle2, Clock, LayoutGrid, Calendar as CalendarIcon, 
    Layers, IndianRupee, Sparkles 
} from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import BookingCalendar from "./components/BookingCalendar";

const ManageMachine = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [machine, setMachine] = useState(location.state?.machine || null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [viewMode, setViewMode] = useState("cards"); // "cards" | "calendar"

    const fetchData = async () => {
        const token = localStorage.getItem("token");
        try {
            if (!machine) {
                const machineRes = await api.get(`/machines/detail/${id}`, { headers: { "auth-token": token } });
                setMachine(machineRes.data);
            }

            const { data } = await api.get("/bookings/fetchall", { headers: { "auth-token": token } });
            const relevant = data.filter(b => (b.machine?._id || b.machine) === id);
            setBookings(relevant);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleStatus = async (bookingId, status) => {
        const actionTitle = status === 'accepted' || status === 'confirmed' 
            ? "Accept Booking Request?" 
            : status === 'completed' 
            ? "Mark Rental Completed?" 
            : "Reject Booking Request?";

        const actionText = status === 'accepted' || status === 'confirmed'
            ? "The farmer will be notified that their request is confirmed."
            : status === 'completed'
            ? "This will mark the service completed and allow the farmer to submit a verified rating."
            : "The farmer will be notified that the machine is unavailable.";

        const result = await Swal.fire({
            title: actionTitle,
            text: actionText,
            icon: status === 'rejected' ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonColor: status === 'rejected' ? '#ef4444' : '#16a34a',
            confirmButtonText: status === 'rejected' ? 'Reject' : 'Confirm',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                await api.put(`/bookings/status/${bookingId}`, { status }, { headers: { "auth-token": token } });

                setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status } : b));

                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: `Booking marked as ${status}`,
                    showConfirmButton: false,
                    timer: 2500
                });
            } catch (err) {
                Swal.fire("Error", err.response?.data?.message || "Could not update status", "error");
            }
        }
    };

    const displayList = bookings.filter(b => {
        if (filter === 'all') return true;
        if (filter === 'pending') return b.status === 'pending';
        if (filter === 'confirmed') return b.status === 'accepted' || b.status === 'confirmed';
        if (filter === 'completed') return b.status === 'completed';
        if (filter === 'rejected') return b.status === 'rejected' || b.status === 'cancelled';
        return true;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case "accepted":
            case "confirmed":
                return { label: "Confirmed", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
            case "completed":
                return { label: "Completed", bg: "bg-blue-50 text-blue-700 border-blue-200" };
            case "rejected":
                return { label: "Rejected", bg: "bg-rose-50 text-rose-700 border-rose-200" };
            case "cancelled":
                return { label: "Cancelled", bg: "bg-slate-100 text-slate-600 border-slate-200" };
            default:
                return { label: "Pending Your Approval", bg: "bg-amber-50 text-amber-700 border-amber-200" };
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            <PageHeader 
                title={machine ? `Manage Bookings: ${machine.name}` : "Manage Machinery Bookings"}
                backTo="/my-machines"
            />

            <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
                
                {/* Control bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800">
                    
                    {/* View Switcher */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full sm:w-auto">
                        <button
                            onClick={() => setViewMode("cards")}
                            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                                viewMode === "cards" 
                                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" 
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span>Card View</span>
                        </button>
                        <button
                            onClick={() => setViewMode("calendar")}
                            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                                viewMode === "calendar" 
                                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" 
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <CalendarIcon className="w-4 h-4" />
                            <span>Calendar View</span>
                        </button>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
                        {[
                            { id: "all", label: "All" },
                            { id: "pending", label: "Pending" },
                            { id: "confirmed", label: "Confirmed" },
                            { id: "completed", label: "Completed" },
                            { id: "rejected", label: "Rejected" }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setFilter(t.id)}
                                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                                    filter === t.id
                                        ? "bg-emerald-600 text-white shadow-xs"
                                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-slate-500 text-sm font-semibold">Loading booking requests...</p>
                    </div>
                ) : viewMode === "calendar" ? (
                    <BookingCalendar 
                        bookings={displayList} 
                        role="owner"
                        onStatusUpdate={handleStatus}
                    />
                ) : displayList.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800">
                        <EmptyState 
                            title="No Bookings in this Category"
                            description="Incoming rental requests from farmers will appear here."
                            icon={Calendar}
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayList.map((b) => {
                            const badge = getStatusBadge(b.status);
                            const bookingDate = new Date(b.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                            });

                            return (
                                <div
                                    key={b._id}
                                    className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                                >
                                    {/* Left: Farmer info & task details */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-base text-slate-900 dark:text-white">
                                                {b.farmer?.name || "Farmer"}
                                            </span>
                                            {b.farmer?.village && (
                                                <span className="text-xs text-slate-400">
                                                    ({b.farmer.village})
                                                </span>
                                            )}
                                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${badge.bg}`}>
                                                {badge.label}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                            <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-lg border border-emerald-200/60">
                                                {b.task?.name || "General Operation"}
                                            </span>
                                            <span>•</span>
                                            <span className="font-semibold">{b.duration || 1} {b.task?.priceUnit || 'hr'}s</span>
                                            {b.totalAmount && (
                                                <>
                                                    <span>•</span>
                                                    <span className="font-bold text-slate-900 dark:text-white">Total: ₹{b.totalAmount}</span>
                                                </>
                                            )}
                                        </div>

                                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Work Date: <strong className="text-slate-700 dark:text-slate-300">{bookingDate}</strong></span>
                                        </p>

                                        {b.notes && (
                                            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 italic">
                                                "{b.notes}"
                                            </p>
                                        )}
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                                        
                                        {b.farmer?.phone && (
                                            <a
                                                href={`tel:${b.farmer.phone}`}
                                                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-emerald-600 hover:bg-slate-50 transition"
                                                title="Call Farmer"
                                            >
                                                <Phone className="w-4 h-4" />
                                            </a>
                                        )}

                                        {b.status === "pending" && (
                                            <>
                                                <button
                                                    onClick={() => handleStatus(b._id, 'accepted')}
                                                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    <span>Accept</span>
                                                </button>
                                                <button
                                                    onClick={() => handleStatus(b._id, 'rejected')}
                                                    className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                    <span>Reject</span>
                                                </button>
                                            </>
                                        )}

                                        {(b.status === "accepted" || b.status === "confirmed") && (
                                            <button
                                                onClick={() => handleStatus(b._id, 'completed')}
                                                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>Mark Completed</span>
                                            </button>
                                        )}

                                    </div>

                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
        </div>
    );
};

export default ManageMachine;
