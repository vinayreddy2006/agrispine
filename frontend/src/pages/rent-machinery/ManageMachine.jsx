import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../../utils/api";
import Swal from "sweetalert2";
import { 
    Trash2, Check, X, Calendar, User, Phone, MessageSquare, 
    CheckCircle2, Clock, LayoutGrid, Calendar as CalendarIcon, 
    Layers, IndianRupee, Sparkles, Wrench, Plus, Edit2, Info, 
    ArrowLeft, ShieldCheck, ChevronRight
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
    const [searchParams, setSearchParams] = useSearchParams();

    const [machine, setMachine] = useState(location.state?.machine || null);
    const [bookings, setBookings] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Main Tab: 'services' | 'bookings' | 'calendar'
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "services");
    
    // Bookings filter
    const [filter, setFilter] = useState("all");

    // Add Service Form State
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState("");
    const [newPrice, setNewPrice] = useState("");
    const [newUnit, setNewUnit] = useState("hour");
    const [newDescription, setNewDescription] = useState("");
    const [submittingService, setSubmittingService] = useState(false);

    // Edit Service State
    const [editingServiceId, setEditingServiceId] = useState(null);
    const [editName, setEditName] = useState("");
    const [editPrice, setEditPrice] = useState("");
    const [editUnit, setEditUnit] = useState("hour");
    const [editDescription, setEditDescription] = useState("");

    const fetchData = async () => {
        const token = localStorage.getItem("token");
        try {
            // Fetch machine details
            const machineRes = await api.get(`/machines/detail/${id}`, { headers: { "auth-token": token } });
            setMachine(machineRes.data);
            setServices(Array.isArray(machineRes.data?.tasks) ? machineRes.data.tasks : []);

            // Fetch bookings
            const { data } = await api.get("/bookings/fetchall", { headers: { "auth-token": token } });
            const relevant = (Array.isArray(data) ? data : []).filter(b => (b.machine?._id || b.machine) === id);
            setBookings(relevant);
        } catch (err) {
            console.error("Error fetching machine management data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    // Handle Status Updates for Bookings
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
                    timer: 2000
                });
            } catch (err) {
                Swal.fire("Error", err.response?.data?.message || "Could not update status", "error");
            }
        }
    };

    // -------------------------------------------------------------
    // SERVICE MANAGEMENT HANDLERS
    // -------------------------------------------------------------
    const handleAddService = async (e) => {
        e.preventDefault();
        if (!newName.trim()) {
            Swal.fire("Validation Error", "Please provide a name for the agricultural service", "warning");
            return;
        }
        if (!newPrice || Number(newPrice) <= 0) {
            Swal.fire("Validation Error", "Please provide a valid price for the service", "warning");
            return;
        }

        setSubmittingService(true);
        try {
            const token = localStorage.getItem("token");
            const { data } = await api.post(`/machines/${id}/services`, {
                name: newName.trim(),
                price: Number(newPrice),
                priceUnit: newUnit,
                description: newDescription.trim(),
                available: true
            }, { headers: { "auth-token": token } });

            setServices(data.tasks);
            setNewName("");
            setNewPrice("");
            setNewDescription("");
            setShowAddForm(false);

            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Agricultural service added successfully',
                showConfirmButton: false,
                timer: 2000
            });
        } catch (err) {
            Swal.fire("Error", err.response?.data?.message || "Could not add service", "error");
        } finally {
            setSubmittingService(false);
        }
    };

    const handleSaveEditService = async (serviceId) => {
        if (!editName.trim()) {
            Swal.fire("Validation Error", "Service name cannot be empty", "warning");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const { data } = await api.put(`/machines/${id}/services/${serviceId}`, {
                name: editName.trim(),
                price: Number(editPrice),
                priceUnit: editUnit,
                description: editDescription.trim()
            }, { headers: { "auth-token": token } });

            setServices(data.tasks);
            setEditingServiceId(null);

            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Service updated. New price applies to future bookings.',
                showConfirmButton: false,
                timer: 2500
            });
        } catch (err) {
            Swal.fire("Error", err.response?.data?.message || "Could not update service", "error");
        }
    };

    const handleToggleService = async (serviceId, currentStatus) => {
        const newStatus = !currentStatus;
        try {
            const token = localStorage.getItem("token");
            setServices(prev => prev.map(s => s._id === serviceId ? { ...s, available: newStatus } : s));

            const { data } = await api.put(`/machines/${id}/services/${serviceId}`, {
                available: newStatus
            }, { headers: { "auth-token": token } });

            if (data.tasks) setServices(data.tasks);

            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: newStatus ? 'Service enabled for bookings' : 'Service disabled for new bookings',
                showConfirmButton: false,
                timer: 2000
            });
        } catch (err) {
            setServices(prev => prev.map(s => s._id === serviceId ? { ...s, available: currentStatus } : s));
            Swal.fire("Error", "Could not toggle service status", "error");
        }
    };

    const handleDeleteService = async (serviceId, serviceName) => {
        const result = await Swal.fire({
            title: `Remove "${serviceName}"?`,
            text: "Any pending requests for this service will be automatically rejected. Existing confirmed and completed bookings will be preserved safely.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Remove Service",
            cancelButtonText: "Keep Service"
        });

        if (!result.isConfirmed) return;

        try {
            const token = localStorage.getItem("token");
            const res = await api.delete(`/machines/${id}/services/${serviceId}`, {
                headers: { "auth-token": token },
                data: { forceCancelConfirmed: false }
            });

            if (res.data?.requiresConfirmation) {
                const confirmedBookings = res.data.confirmedBookings || [];
                const bookingListHtml = `
                    <div style="text-align: left; max-height: 180px; overflow-y: auto; margin: 12px 0; padding: 10px; background: #f8fafc; border-radius: 12px; font-size: 12px;">
                        <p style="font-weight: bold; margin-bottom: 6px; color: #b91c1c;">
                            ${confirmedBookings.length} confirmed upcoming booking(s) scheduled:
                        </p>
                        ${confirmedBookings.map((b, idx) => `
                            <div style="padding: 6px 0; border-bottom: 1px solid #e2e8f0;">
                                <strong>${idx + 1}. ${b.farmerName}</strong> (${b.farmerPhone || 'No Phone'})<br/>
                                Date: ${new Date(b.date).toLocaleDateString()} | Amount: ₹${b.totalAmount || 0}
                            </div>
                        `).join('')}
                    </div>
                    <p style="font-size: 13px; color: #475569;">
                        Removing this service will <strong>cancel these confirmed bookings</strong> and notify the farmers. Completed historical records will remain intact.
                    </p>
                `;

                const confirmCancel = await Swal.fire({
                    title: "Confirmed Bookings Scheduled!",
                    html: bookingListHtml,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#dc2626",
                    confirmButtonText: "Cancel Bookings & Remove Service",
                    cancelButtonText: "Do Not Remove",
                    focusCancel: true
                });

                if (confirmCancel.isConfirmed) {
                    const finalRes = await api.delete(`/machines/${id}/services/${serviceId}`, {
                        headers: { "auth-token": token },
                        data: { forceCancelConfirmed: true }
                    });

                    setServices(finalRes.data.tasks);

                    Swal.fire({
                        title: "Service Removed",
                        text: `"${serviceName}" has been removed. Affected bookings were cancelled and renters notified.`,
                        icon: "success",
                        timer: 3000,
                        showConfirmButton: false
                    });
                }
                return;
            }

            setServices(res.data.tasks);
            Swal.fire({
                title: "Service Removed",
                text: `"${serviceName}" has been removed.`,
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            });

        } catch (err) {
            Swal.fire("Error", err.response?.data?.message || "Could not delete service", "error");
        }
    };

    const displayBookings = bookings.filter(b => {
        if (filter === 'all') return true;
        if (filter === 'pending') return b.status === 'pending';
        if (filter === 'confirmed') return b.status === 'accepted' || b.status === 'confirmed';
        if (filter === 'completed') return b.status === 'completed';
        if (filter === 'rejected') return b.status === 'rejected' || b.status === 'cancelled';
        return true;
    });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            <PageHeader 
                title={machine ? `Manage: ${machine.name}` : "Manage Equipment"}
                backTo="/rent-machinery?mode=owner&tab=fleet"
            />

            <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
                
                {/* Machine Overview Card */}
                {machine && (
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <img
                                src={machine.image || "/machines/tractor.png"}
                                alt={machine.name}
                                className="w-16 h-16 rounded-2xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 shrink-0"
                            />
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                                        {machine.name}
                                    </h2>
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                        {machine.type}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                    <span>Base Rate: <strong>₹{machine.price} / {machine.priceUnit || 'hour'}</strong></span>
                                    <span>•</span>
                                    <span className={machine.available !== false ? "text-emerald-600 font-bold" : "text-slate-400 font-bold"}>
                                        {machine.available !== false ? "Listing Available" : "Listing Unavailable"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate(`/rent/details/${machine._id}`)}
                            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                        >
                            <span>View Public Listing</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Primary Mode Navigation Tabs */}
                <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
                    <button
                        onClick={() => { setActiveTab("services"); setSearchParams({ tab: "services" }); }}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition shrink-0 ${
                            activeTab === "services"
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                    >
                        <Wrench className="w-4 h-4" />
                        <span>Services & Tasks</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            activeTab === "services" ? "bg-emerald-800 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                        }`}>
                            {services.length}
                        </span>
                    </button>

                    <button
                        onClick={() => { setActiveTab("bookings"); setSearchParams({ tab: "bookings" }); }}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition shrink-0 ${
                            activeTab === "bookings"
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        <span>Booking Requests</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            activeTab === "bookings" ? "bg-emerald-800 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                        }`}>
                            {bookings.length}
                        </span>
                    </button>

                    <button
                        onClick={() => { setActiveTab("calendar"); setSearchParams({ tab: "calendar" }); }}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition shrink-0 ${
                            activeTab === "calendar"
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                    >
                        <CalendarIcon className="w-4 h-4" />
                        <span>Equipment Schedule Calendar</span>
                    </button>
                </div>

                {/* ============================================================== */}
                {/* TAB 1: SERVICES & TASKS MANAGEMENT                             */}
                {/* ============================================================== */}
                {activeTab === "services" && (
                    <div className="space-y-5">
                        
                        {/* Note on Pricing */}
                        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <p className="leading-relaxed font-medium">
                                <strong>Agricultural Tasks & Rates:</strong> Configure individual tasks offered with this machine. When you change a task's price, it applies only to future bookings. All existing bookings retain their originally agreed prices.
                            </p>
                        </div>

                        {/* Top Action Bar */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                                Offered Agricultural Operations ({services.length})
                            </h3>

                            {!showAddForm && (
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4 stroke-[2.5]" />
                                    <span>Add Agricultural Service</span>
                                </button>
                            )}
                        </div>

                        {/* Add Service Inline Form */}
                        {showAddForm && (
                            <form onSubmit={handleAddService} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-in slide-in-from-top-2">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                                        Add New Agricultural Service
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddForm(false)}
                                        className="text-xs font-bold text-slate-400 hover:text-slate-600"
                                    >
                                        Cancel
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                                            Service Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g., Deep Ploughing, Rotavator, Drone Spraying"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                                                Rate (₹) *
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                placeholder="e.g., 900"
                                                value={newPrice}
                                                onChange={(e) => setNewPrice(e.target.value)}
                                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>

                                        <div className="w-32">
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                                                Unit
                                            </label>
                                            <select
                                                value={newUnit}
                                                onChange={(e) => setNewUnit(e.target.value)}
                                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <option value="hour">per hour</option>
                                                <option value="acre">per acre</option>
                                                <option value="day">per day</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                                        Optional Description
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Includes experienced driver and fuel costs"
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddForm(false)}
                                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingService}
                                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition flex items-center gap-1.5"
                                    >
                                        <Check className="w-4 h-4 stroke-[2.5]" />
                                        <span>{submittingService ? "Saving..." : "Save Service"}</span>
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Services List */}
                        <div className="space-y-3">
                            {services.length === 0 ? (
                                <EmptyState
                                    title="No Agricultural Services Configured"
                                    description="Add agricultural tasks like Ploughing, Sowing or Spraying with individual prices to start receiving tailored bookings."
                                    icon={Wrench}
                                    actionText="Add Service"
                                    onAction={() => setShowAddForm(true)}
                                />
                            ) : (
                                services.map(srv => {
                                    const isEditing = editingServiceId === srv._id;
                                    const isAvailable = srv.available !== false;

                                    if (isEditing) {
                                        return (
                                            <div key={srv._id} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-sm space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-500 block mb-1">Service Name</label>
                                                        <input
                                                            type="text"
                                                            value={editName}
                                                            onChange={(e) => setEditName(e.target.value)}
                                                            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1">
                                                            <label className="text-xs font-bold text-slate-500 block mb-1">Rate (₹)</label>
                                                            <input
                                                                type="number"
                                                                value={editPrice}
                                                                onChange={(e) => setEditPrice(e.target.value)}
                                                                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold"
                                                            />
                                                        </div>
                                                        <div className="w-32">
                                                            <label className="text-xs font-bold text-slate-500 block mb-1">Unit</label>
                                                            <select
                                                                value={editUnit}
                                                                onChange={(e) => setEditUnit(e.target.value)}
                                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold"
                                                            >
                                                                <option value="hour">per hour</option>
                                                                <option value="acre">per acre</option>
                                                                <option value="day">per day</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 block mb-1">Description</label>
                                                    <input
                                                        type="text"
                                                        value={editDescription}
                                                        onChange={(e) => setEditDescription(e.target.value)}
                                                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold"
                                                    />
                                                </div>

                                                <div className="flex justify-end gap-2 pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingServiceId(null)}
                                                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveEditService(srv._id)}
                                                        className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-xs flex items-center gap-1.5"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                        <span>Save Changes</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={srv._id}
                                            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-300 transition"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-black text-base text-slate-900 dark:text-white">
                                                        {srv.name}
                                                    </h4>
                                                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-200/50">
                                                        ₹{srv.price} / {srv.priceUnit || 'hour'}
                                                    </span>
                                                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                                        isAvailable 
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                                                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                        {isAvailable ? 'Enabled' : 'Disabled'}
                                                    </span>
                                                </div>

                                                {srv.description && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {srv.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Action Controls */}
                                            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 w-full sm:w-auto justify-end">
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={isAvailable}
                                                    onClick={() => handleToggleService(srv._id, isAvailable)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition min-h-[36px]"
                                                    title={isAvailable ? "Click to disable service" : "Click to enable service"}
                                                >
                                                    <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                                                        isAvailable ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                                                    }`}>
                                                        <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-xs transform transition-transform duration-200 ${
                                                            isAvailable ? 'translate-x-3.5' : 'translate-x-0'
                                                        }`} />
                                                    </div>
                                                    <span>{isAvailable ? 'Active' : 'Disabled'}</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingServiceId(srv._id);
                                                        setEditName(srv.name);
                                                        setEditPrice(srv.price);
                                                        setEditUnit(srv.priceUnit || "hour");
                                                        setEditDescription(srv.description || "");
                                                    }}
                                                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition"
                                                    title="Edit Service"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteService(srv._id, srv.name)}
                                                    className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                                    title="Remove Service"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                    </div>
                )}

                {/* ============================================================== */}
                {/* TAB 2: BOOKING REQUESTS CARDS                                  */}
                {/* ============================================================== */}
                {activeTab === "bookings" && (
                    <div className="space-y-5">
                        
                        {/* Status Filter Tabs */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                            {[
                                { id: "all", label: "All Requests" },
                                { id: "pending", label: "Pending Approval" },
                                { id: "confirmed", label: "Confirmed" },
                                { id: "completed", label: "Completed" },
                                { id: "rejected", label: "Rejected / Cancelled" }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setFilter(t.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                                        filter === t.id
                                            ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                                            : "bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Bookings List */}
                        {loading ? (
                            <div className="py-12 text-center text-xs text-slate-400">Loading bookings...</div>
                        ) : displayBookings.length === 0 ? (
                            <EmptyState
                                title="No Booking Requests in this Category"
                                description="Incoming booking requests for this machine will appear here."
                                icon={CalendarIcon}
                            />
                        ) : (
                            <div className="space-y-4">
                                {displayBookings.map(b => {
                                    const farmer = b.farmer || {};
                                    const isPending = b.status === 'pending';
                                    const isConfirmed = b.status === 'accepted' || b.status === 'confirmed';

                                    return (
                                        <div
                                            key={b._id}
                                            className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                                        >
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-black text-base text-slate-900 dark:text-white">
                                                        {farmer.name || "Farmer"}
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                        {b.status}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                                                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                                        {b.task?.name || "General Work"}
                                                    </span>
                                                    <span>•</span>
                                                    <span>Date: <strong>{b.date ? new Date(b.date).toLocaleDateString() : 'N/A'}</strong></span>
                                                    <span>•</span>
                                                    <span>Duration: {b.duration || 1} hr</span>
                                                    {b.totalAmount && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="font-black text-slate-900 dark:text-white">Total: ₹{b.totalAmount}</span>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                                    {farmer.village && <span>Village: {farmer.village}</span>}
                                                    {farmer.phone && (
                                                        <a href={`tel:${farmer.phone}`} className="text-emerald-600 font-bold hover:underline flex items-center gap-1">
                                                            <Phone className="w-3.5 h-3.5" />
                                                            <span>{farmer.phone}</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                                                {isPending && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatus(b._id, 'accepted')}
                                                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                                                        >
                                                            <Check className="w-4 h-4 stroke-[2.5]" />
                                                            <span>Accept Request</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatus(b._id, 'rejected')}
                                                            className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1.5"
                                                        >
                                                            <X className="w-4 h-4 stroke-[2.5]" />
                                                            <span>Reject</span>
                                                        </button>
                                                    </>
                                                )}

                                                {isConfirmed && (
                                                    <button
                                                        onClick={() => handleStatus(b._id, 'completed')}
                                                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm transition flex items-center gap-1.5"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
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
                )}

                {/* ============================================================== */}
                {/* TAB 3: SCHEDULE CALENDAR                                       */}
                {/* ============================================================== */}
                {activeTab === "calendar" && (
                    <BookingCalendar
                        bookings={bookings}
                        role="owner"
                        onStatusUpdate={handleStatus}
                    />
                )}

            </div>
        </div>
    );
};

export default ManageMachine;
