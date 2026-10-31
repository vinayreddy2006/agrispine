import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import Swal from "sweetalert2";
import { 
    Calendar, User, Filter, LayoutGrid, Calendar as CalendarIcon, 
    Clock, CheckCircle2, XCircle, AlertCircle, Phone, MessageSquare, 
    Star, Sparkles, MapPin, IndianRupee, Layers 
} from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import BookingCalendar from "./components/BookingCalendar";
import ReviewModal from "./components/ReviewModal";

const MyBookings = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [viewMode, setViewMode] = useState("cards"); // "cards" | "calendar"

    // Review Modal State
    const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);

    const fetchBookings = async () => {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        if (!userStr) {
            setLoading(false);
            return;
        }

        try {
            const { data } = await api.get("/bookings/renter", { 
                headers: { "auth-token": token } 
            });
            setBookings(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load renter bookings:", err);
            // Fallback to fetchall if renter endpoint fails
            try {
                const { data } = await api.get("/bookings/fetchall", { headers: { "auth-token": token } });
                const userObj = JSON.parse(userStr);
                const userId = userObj._id || userObj.id;
                const renterOnly = data.filter(b => String(b.farmer?._id || b.farmer) === String(userId));
                setBookings(renterOnly);
            } catch (e) {
                console.error(e);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleCancelBooking = async (bookingId) => {
        const result = await Swal.fire({
            title: "Cancel Booking Request?",
            text: "Are you sure you want to cancel this booking request?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Yes, Cancel",
            cancelButtonText: "Keep Booking"
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                await api.put(`/bookings/status/${bookingId}`, { status: "cancelled" }, {
                    headers: { "auth-token": token }
                });

                setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: "cancelled" } : b));

                Swal.fire({
                    title: "Booking Cancelled",
                    icon: "success",
                    timer: 2000,
                    showConfirmButton: false
                });
            } catch (err) {
                Swal.fire("Error", err.response?.data?.message || "Could not cancel booking", "error");
            }
        }
    };

    const handleStartChat = async (providerId) => {
        try {
            const token = localStorage.getItem("token");
            await api.post("/chat/conversations", {
                participantIds: [providerId],
                isGroup: false
            }, { headers: { "auth-token": token } });
            navigate("/messages");
        } catch (err) {
            Swal.fire("Error", "Could not initiate chat", "error");
        }
    };

    // Filter by tabs
    const filteredBookings = bookings.filter(b => {
        if (activeTab === "all") return true;
        if (activeTab === "pending") return b.status === "pending";
        if (activeTab === "accepted") return b.status === "accepted" || b.status === "confirmed";
        if (activeTab === "completed") return b.status === "completed";
        if (activeTab === "cancelled") return ["cancelled", "rejected"].includes(b.status);
        return true;
    });

    const getStatusStyle = (status) => {
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
                return { label: "Pending Owner Confirmation", bg: "bg-amber-50 text-amber-700 border-amber-200" };
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            <PageHeader 
                title="My Machinery Bookings" 
                backTo="/rent/list/all" 
            />

            <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
                
                {/* Header Controls Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800">
                    
                    {/* View Switcher: Card View vs Calendar View */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full sm:w-auto">
                        <button
                            onClick={() => setViewMode("cards")}
                            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                                viewMode === "cards" 
                                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" 
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
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
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            }`}
                        >
                            <CalendarIcon className="w-4 h-4" />
                            <span>Calendar View</span>
                        </button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar text-xs">
                        {[
                            { id: "all", label: "All" },
                            { id: "pending", label: "Pending" },
                            { id: "accepted", label: "Confirmed" },
                            { id: "completed", label: "Completed" },
                            { id: "cancelled", label: "Cancelled / Rejected" }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold transition ${
                                    activeTab === tab.id
                                        ? "bg-emerald-600 text-white shadow-xs"
                                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                </div>

                {/* Main Content Area */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-slate-500 text-sm font-semibold">Loading your bookings...</p>
                    </div>
                ) : viewMode === "calendar" ? (
                    <BookingCalendar 
                        bookings={filteredBookings} 
                        role="renter" 
                    />
                ) : filteredBookings.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800">
                        <EmptyState 
                            title="No Bookings Found"
                            description={`You have no ${activeTab === 'all' ? '' : activeTab} machinery bookings at this time.`}
                            actionText="Browse Available Machinery"
                            onAction={() => navigate("/rent/list/all")}
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredBookings.map((b) => {
                            const statusInfo = getStatusStyle(b.status);
                            const bookingDate = new Date(b.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                            });

                            return (
                                <div
                                    key={b._id}
                                    className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition hover:shadow-md"
                                >
                                    {/* Left: Machine Photo & Details */}
                                    <div className="flex items-start sm:items-center gap-4 w-full md:w-auto">
                                        <img
                                            src={b.machine?.image || "/machines/tractor.png"}
                                            alt=""
                                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 flex-shrink-0"
                                        />

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                                                    {b.machine?.name || "Machinery"}
                                                </h3>
                                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.bg}`}>
                                                    {statusInfo.label}
                                                </span>
                                            </div>

                                            {/* Task / Operation Badge */}
                                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                                <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200/60">
                                                    {b.task?.name || "Standard Operation"}
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

                                            {/* Date */}
                                            <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-0.5">
                                                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Reserved for: <strong className="text-slate-700 dark:text-slate-300">{bookingDate}</strong></span>
                                            </p>

                                            {/* Owner Info */}
                                            <p className="text-xs text-slate-400 flex items-center gap-1 pt-0.5">
                                                <User className="w-3 h-3" />
                                                <span>Owner: {b.provider?.name || "Local Provider"}</span>
                                                {b.provider?.village && <span>• {b.provider.village}</span>}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                                        
                                        {/* Contact Owner */}
                                        {b.provider?._id && (
                                            <button
                                                onClick={() => handleStartChat(b.provider._id)}
                                                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-emerald-600 hover:bg-slate-50 transition"
                                                title="Chat with Machine Owner"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </button>
                                        )}

                                        {b.provider?.phone && (
                                            <a
                                                href={`tel:${b.provider.phone}`}
                                                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-emerald-600 hover:bg-slate-50 transition"
                                                title="Call Owner"
                                            >
                                                <Phone className="w-4 h-4" />
                                            </a>
                                        )}

                                        {/* Cancel Request (If pending) */}
                                        {b.status === "pending" && (
                                            <button
                                                onClick={() => handleCancelBooking(b._id)}
                                                className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition"
                                            >
                                                Cancel Request
                                            </button>
                                        )}

                                        {/* Review / Rating button (If completed) */}
                                        {b.status === "completed" && (
                                            b.reviewSubmitted ? (
                                                <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold flex items-center gap-1">
                                                    <Star className="w-3.5 h-3.5 fill-current" />
                                                    <span>Reviewed</span>
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => setSelectedBookingForReview(b)}
                                                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-200 flex items-center gap-1.5 transition"
                                                >
                                                    <Star className="w-3.5 h-3.5 fill-current" />
                                                    <span>Rate & Review</span>
                                                </button>
                                            )
                                        )}

                                    </div>

                                </div>
                            );
                        })}
                    </div>
                )}

            </div>

            {/* Review Submission Modal */}
            <ReviewModal
                isOpen={!!selectedBookingForReview}
                onClose={() => setSelectedBookingForReview(null)}
                booking={selectedBookingForReview}
                onReviewSubmitted={(bookingId) => {
                    setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, reviewSubmitted: true } : b));
                }}
            />

        </div>
    );
};

export default MyBookings;
