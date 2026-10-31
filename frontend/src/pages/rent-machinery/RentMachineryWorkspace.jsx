import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../../utils/api";
import Swal from "sweetalert2";
import { 
    Tractor, Wrench, Search, Calendar, ClipboardList, CheckCircle2, 
    XCircle, Clock, AlertCircle, Phone, MessageSquare, Star, 
    MapPin, IndianRupee, Layers, PlusCircle, Filter, ArrowRight, 
    RotateCcw, SlidersHorizontal, ChevronRight, Eye, Sparkles, 
    Check, X, ShieldCheck, Tag, Trash2, Edit3, Power, Compass,
    CheckCircle, LayoutGrid
} from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import BookingCalendar from "./components/BookingCalendar";
import ReviewModal from "./components/ReviewModal";

// Machine categories
const CATEGORIES = [
    { name: "All", img: "/machines/tractor.png" },
    { name: "Tractor", img: "/machines/tractor.png" },
    { name: "Harvester", img: "/machines/harvestor.png" },
    { name: "Rotavator", img: "/machines/rotavator.png" },
    { name: "Drone", img: "/machines/drone_spray.png" },
    { name: "JCB", img: "/machines/jcb.png" },
    { name: "Rice Planter", img: "/machines/rice_planter.png" },
    { name: "Dozer", img: "/machines/dozer.png" },
    { name: "Baler", img: "/machines/baler.png" },
    { name: "Ridger", img: "/machines/ridger.png" },
];

const CATEGORY_IMAGES = {
    tractor: '/machines/tractor.png',
    harvester: '/machines/harvestor.png',
    harvestor: '/machines/harvestor.png',
    rotavator: '/machines/rotavator.png',
    drone: '/machines/drone_spray.png',
    'drone spray': '/machines/drone_spray.png',
    jcb: '/machines/jcb.png',
    'rice planter': '/machines/rice_planter.png',
    dozer: '/machines/dozer.png',
    baler: '/machines/baler.png',
    ridger: '/machines/ridger.png'
};

const getMachineImage = (machine) => {
    if (machine?.image && machine.image.startsWith('http') && !machine.image.includes('cdn-icons-png.flaticon.com')) {
        return machine.image;
    }
    const cat = (machine?.type || '').toLowerCase().trim();
    return CATEGORY_IMAGES[cat] || '/machines/tractor.png';
};

const RentMachineryWorkspace = ({ defaultMode, defaultTab }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Mode state: 'rent' (Rent Equipment) | 'owner' (Manage My Equipment)
    const initialMode = searchParams.get("mode") || defaultMode || "rent";
    const [mode, setMode] = useState(initialMode);

    // Sub-tab for Rent Mode: 'discover' | 'bookings' | 'calendar'
    const initialRentTab = searchParams.get("tab") || (mode === 'rent' ? defaultTab : 'discover') || 'discover';
    const [rentTab, setRentTab] = useState(initialRentTab);

    // Sub-tab for Owner Mode: 'fleet' | 'requests' | 'calendar'
    const initialOwnerTab = searchParams.get("tab") || (mode === 'owner' ? defaultTab : 'fleet') || 'fleet';
    const [ownerTab, setOwnerTab] = useState(initialOwnerTab);

    // Current logged in user
    const [currentUser, setCurrentUser] = useState(null);

    // Data States
    const [allMachines, setAllMachines] = useState([]);
    const [renterBookings, setRenterBookings] = useState([]);
    const [ownerMachines, setOwnerMachines] = useState([]);
    const [ownerRequests, setOwnerRequests] = useState([]);

    // Loading States
    const [loadingMachines, setLoadingMachines] = useState(true);
    const [loadingRenterBookings, setLoadingRenterBookings] = useState(true);
    const [loadingOwnerMachines, setLoadingOwnerMachines] = useState(true);
    const [loadingOwnerRequests, setLoadingOwnerRequests] = useState(true);

    // Discover Equipment Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [proximityFilter, setProximityFilter] = useState("all"); // 'all' | 'village' | 'district'
    const [availabilityFilter, setAvailabilityFilter] = useState("all"); // 'all' | 'available'
    const [sortBy, setSortBy] = useState("recommended"); // 'recommended' | 'price_asc' | 'price_desc' | 'rating_desc'

    // Status Filters
    const [renterStatusFilter, setRenterStatusFilter] = useState("all");
    const [ownerStatusFilter, setOwnerStatusFilter] = useState("all");

    // Review Modal
    const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);

    // Sync Mode & Sub-tab with URL
    useEffect(() => {
        const currentUrlMode = searchParams.get("mode");
        const currentUrlTab = searchParams.get("tab");
        const activeTab = mode === 'rent' ? rentTab : ownerTab;

        if (currentUrlMode !== mode || currentUrlTab !== activeTab) {
            setSearchParams({ mode, tab: activeTab }, { replace: true });
        }
    }, [mode, rentTab, ownerTab]);

    // Load User
    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                setCurrentUser(JSON.parse(userStr));
            } catch (e) {
                console.error("User parse error", e);
            }
        }
    }, []);

    // 1. Fetch All Machinery (for Discover)
    const fetchAllMachines = async () => {
        setLoadingMachines(true);
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { "auth-token": token } : {};
            const { data } = await api.get('/machines/fetchall', { headers });
            setAllMachines(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load machinery listings:", err);
        } finally {
            setLoadingMachines(false);
        }
    };

    // 2. Fetch Renter Bookings
    const fetchRenterBookings = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setLoadingRenterBookings(false);
            return;
        }
        setLoadingRenterBookings(true);
        try {
            const { data } = await api.get('/bookings/renter', { headers: { "auth-token": token } });
            setRenterBookings(Array.isArray(data) ? data : []);
        } catch (err) {
            // Fallback to fetchall filtering
            try {
                const { data } = await api.get('/bookings/fetchall', { headers: { "auth-token": token } });
                const userObj = JSON.parse(localStorage.getItem("user") || "{}");
                const userId = userObj._id || userObj.id;
                const filtered = (Array.isArray(data) ? data : []).filter(
                    b => String(b.farmer?._id || b.farmer) === String(userId)
                );
                setRenterBookings(filtered);
            } catch (e) {
                console.error(e);
            }
        } finally {
            setLoadingRenterBookings(false);
        }
    };

    // 3. Fetch Owner Machines
    const fetchOwnerMachines = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setLoadingOwnerMachines(false);
            return;
        }
        setLoadingOwnerMachines(true);
        try {
            const { data } = await api.get('/machines/own', { headers: { "auth-token": token } });
            setOwnerMachines(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load owner machines:", err);
        } finally {
            setLoadingOwnerMachines(false);
        }
    };

    // 4. Fetch Owner Requests
    const fetchOwnerRequests = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setLoadingOwnerRequests(false);
            return;
        }
        setLoadingOwnerRequests(true);
        try {
            const { data } = await api.get('/bookings/requests', { headers: { "auth-token": token } });
            setOwnerRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            // Fallback to fetchall
            try {
                const { data } = await api.get('/bookings/fetchall', { headers: { "auth-token": token } });
                const userObj = JSON.parse(localStorage.getItem("user") || "{}");
                const userId = userObj._id || userObj.id;
                const filtered = (Array.isArray(data) ? data : []).filter(
                    b => String(b.provider?._id || b.provider) === String(userId)
                );
                setOwnerRequests(filtered);
            } catch (e) {
                console.error(e);
            }
        } finally {
            setLoadingOwnerRequests(false);
        }
    };

    // Initial Data Fetch
    useEffect(() => {
        fetchAllMachines();
        fetchRenterBookings();
        fetchOwnerMachines();
        fetchOwnerRequests();
    }, []);

    // Switch Operating Mode
    const handleModeSwitch = (newMode) => {
        setMode(newMode);
        const newTab = newMode === 'rent' ? rentTab : ownerTab;
        setSearchParams({ mode: newMode, tab: newTab });
    };

    // -------------------------------------------------------------
    // RENTER ACTIONS
    // -------------------------------------------------------------
    const handleCancelBooking = async (bookingId) => {
        const result = await Swal.fire({
            title: "Cancel Booking Request?",
            text: "Are you sure you want to cancel this machinery booking?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Yes, Cancel Booking",
            cancelButtonText: "Keep Booking"
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                await api.put(`/bookings/status/${bookingId}`, { status: "cancelled" }, {
                    headers: { "auth-token": token }
                });

                setRenterBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: "cancelled" } : b));

                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Booking cancelled',
                    showConfirmButton: false,
                    timer: 2000
                });
            } catch (err) {
                Swal.fire("Error", err.response?.data?.message || "Could not cancel booking", "error");
            }
        }
    };

    // Direct chat with provider
    const handleStartChat = async (providerId) => {
        try {
            const token = localStorage.getItem("token");
            await api.post("/chat/conversations", {
                participantIds: [providerId],
                isGroup: false
            }, { headers: { "auth-token": token } });
            navigate("/messages");
        } catch (err) {
            navigate("/messages");
        }
    };

    // -------------------------------------------------------------
    // OWNER ACTIONS
    // -------------------------------------------------------------
    const handleOwnerStatusUpdate = async (bookingId, newStatus) => {
        const actionTitle = newStatus === 'accepted' || newStatus === 'confirmed'
            ? "Accept Booking Request?"
            : newStatus === 'completed'
            ? "Mark Rental Completed?"
            : "Reject Booking Request?";

        const actionText = newStatus === 'accepted' || newStatus === 'confirmed'
            ? "The farmer will be notified that their request is confirmed."
            : newStatus === 'completed'
            ? "Service marked completed. The farmer can now submit their verified review."
            : "The farmer will be notified that the machine is unavailable.";

        const result = await Swal.fire({
            title: actionTitle,
            text: actionText,
            icon: newStatus === 'rejected' ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonColor: newStatus === 'rejected' ? '#ef4444' : '#16a34a',
            confirmButtonText: newStatus === 'rejected' ? 'Reject' : 'Confirm',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                await api.put(`/bookings/status/${bookingId}`, { status: newStatus }, {
                    headers: { "auth-token": token }
                });

                setOwnerRequests(prev => prev.map(b => b._id === bookingId ? { ...b, status: newStatus } : b));

                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: `Booking marked as ${newStatus}`,
                    showConfirmButton: false,
                    timer: 2000
                });
            } catch (err) {
                Swal.fire("Error", err.response?.data?.message || "Could not update booking status", "error");
            }
        }
    };

    // Quick Toggle Machine Availability
    const handleToggleAvailability = async (machineId, currentStatus) => {
        const newAvailable = !currentStatus;
        try {
            const token = localStorage.getItem("token");
            // Optimistic update
            setOwnerMachines(prev => prev.map(m => m._id === machineId ? { ...m, available: newAvailable } : m));

            await api.put(`/machines/update/${machineId}`, { available: newAvailable }, {
                headers: { "auth-token": token }
            });

            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: newAvailable ? "Machine listed as Available" : "Machine marked as Unavailable",
                showConfirmButton: false,
                timer: 2000
            });
        } catch (err) {
            // Revert on failure
            setOwnerMachines(prev => prev.map(m => m._id === machineId ? { ...m, available: currentStatus } : m));
            Swal.fire("Error", "Could not update availability", "error");
        }
    };

    // Delete Machine
    const handleDeleteMachine = async (machineId, machineName) => {
        const result = await Swal.fire({
            title: `Delete ${machineName}?`,
            text: "This machine listing will be permanently removed. This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "Yes, Delete Listing",
            cancelButtonText: "Cancel"
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                await api.delete(`/machines/delete/${machineId}`, {
                    headers: { "auth-token": token }
                });

                setOwnerMachines(prev => prev.filter(m => m._id !== machineId));

                Swal.fire({
                    title: "Deleted!",
                    text: `${machineName} has been deleted.`,
                    icon: "success",
                    timer: 2000,
                    showConfirmButton: false
                });
            } catch (err) {
                Swal.fire("Error", err.response?.data?.message || "Could not delete machine", "error");
            }
        }
    };

    // -------------------------------------------------------------
    // FILTERED LISTINGS (DISCOVER EQUIPMENT)
    // -------------------------------------------------------------
    const filteredMachines = useMemo(() => {
        return allMachines.filter(m => {
            // Category filter
            if (selectedCategory !== "All" && (m.type || "").toLowerCase() !== selectedCategory.toLowerCase()) {
                return false;
            }

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const nameMatch = (m.name || "").toLowerCase().includes(q);
                const typeMatch = (m.type || "").toLowerCase().includes(q);
                const villageMatch = (m.user?.village || m.provider?.village || "").toLowerCase().includes(q);
                const taskMatch = Array.isArray(m.tasks) && m.tasks.some(t => (t.name || "").toLowerCase().includes(q));
                if (!nameMatch && !typeMatch && !villageMatch && !taskMatch) {
                    return false;
                }
            }

            // Proximity filter
            if (proximityFilter === 'village' && currentUser?.village) {
                const machineVillage = m.user?.village || m.provider?.village || "";
                if (machineVillage.toLowerCase() !== currentUser.village.toLowerCase()) return false;
            } else if (proximityFilter === 'district' && currentUser?.district) {
                const machineDistrict = m.user?.district || m.provider?.district || "";
                if (machineDistrict.toLowerCase() !== currentUser.district.toLowerCase()) return false;
            }

            // Availability filter
            if (availabilityFilter === 'available' && m.available === false) {
                return false;
            }

            return true;
        }).sort((a, b) => {
            if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
            if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
            if (sortBy === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
            return 0; // recommended
        });
    }, [allMachines, selectedCategory, searchQuery, proximityFilter, availabilityFilter, sortBy, currentUser]);

    // -------------------------------------------------------------
    // FILTERED RENTER BOOKINGS
    // -------------------------------------------------------------
    const filteredRenterBookings = useMemo(() => {
        return renterBookings.filter(b => {
            if (renterStatusFilter === "all") return true;
            if (renterStatusFilter === "pending") return b.status === "pending";
            if (renterStatusFilter === "confirmed") return b.status === "accepted" || b.status === "confirmed";
            if (renterStatusFilter === "completed") return b.status === "completed";
            if (renterStatusFilter === "cancelled") return b.status === "cancelled" || b.status === "rejected";
            return true;
        });
    }, [renterBookings, renterStatusFilter]);

    // -------------------------------------------------------------
    // FILTERED OWNER REQUESTS
    // -------------------------------------------------------------
    const filteredOwnerRequests = useMemo(() => {
        return ownerRequests.filter(b => {
            if (ownerStatusFilter === "all") return true;
            if (ownerStatusFilter === "pending") return b.status === "pending";
            if (ownerStatusFilter === "confirmed") return b.status === "accepted" || b.status === "confirmed";
            if (ownerStatusFilter === "completed") return b.status === "completed";
            if (ownerStatusFilter === "cancelled") return b.status === "cancelled" || b.status === "rejected";
            return true;
        });
    }, [ownerRequests, ownerStatusFilter]);

    // -------------------------------------------------------------
    // OWNER KPI STATISTICS
    // -------------------------------------------------------------
    const ownerStats = useMemo(() => {
        const totalListed = ownerMachines.length;
        const activeListings = ownerMachines.filter(m => m.available !== false).length;
        const availableNow = ownerMachines.filter(m => m.available).length;
        const pendingRequests = ownerRequests.filter(b => b.status === 'pending').length;
        const confirmedBookings = ownerRequests.filter(b => b.status === 'accepted' || b.status === 'confirmed').length;

        return {
            totalListed,
            activeListings,
            availableNow,
            pendingRequests,
            confirmedBookings
        };
    }, [ownerMachines, ownerRequests]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 text-slate-800 dark:text-slate-100 transition-colors">
            
            {/* Header */}
            <PageHeader 
                title="Rent Machinery"
                icon={Tractor}
                rightActions={<LanguageSwitcher />}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

                {/* ============================================================== */}
                {/* PROMINENT DUAL OPERATING MODE SELECTOR                         */}
                {/* ============================================================== */}
                <div className="bg-white dark:bg-slate-850 p-3 sm:p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        
                        {/* MODE 1: RENT EQUIPMENT */}
                        <button
                            type="button"
                            onClick={() => handleModeSwitch('rent')}
                            className={`p-5 rounded-2xl text-left transition-all duration-200 relative overflow-hidden group border-2 ${
                                mode === 'rent'
                                    ? 'bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 dark:from-emerald-950/40 dark:via-slate-800 dark:to-emerald-950/20 border-emerald-600 dark:border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:border-slate-300'
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-13 h-13 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                                    mode === 'rent'
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                }`}>
                                    <Tractor className="w-7 h-7" />
                                </div>
                                <div className="flex-1 pr-6">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                            Rent Equipment
                                        </h2>
                                        {mode === 'rent' && (
                                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                                                Active Mode
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed font-medium">
                                        Find nearby tractors, harvesters and other agricultural machinery. Explore services, check availability and manage your bookings.
                                    </p>
                                </div>
                            </div>

                            {/* Active subtle badge indicator */}
                            {mode === 'rent' && (
                                <div className="absolute top-4 right-4 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="w-5 h-5 fill-emerald-600 text-white dark:fill-emerald-400 dark:text-slate-900" />
                                </div>
                            )}
                        </button>

                        {/* MODE 2: MANAGE MY EQUIPMENT */}
                        <button
                            type="button"
                            onClick={() => handleModeSwitch('owner')}
                            className={`p-5 rounded-2xl text-left transition-all duration-200 relative overflow-hidden group border-2 ${
                                mode === 'owner'
                                    ? 'bg-gradient-to-br from-amber-50 via-white to-amber-50/40 dark:from-amber-950/40 dark:via-slate-800 dark:to-amber-950/20 border-amber-600 dark:border-amber-500 shadow-md ring-2 ring-amber-500/20'
                                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:border-slate-300'
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-13 h-13 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                                    mode === 'owner'
                                        ? 'bg-amber-600 text-white shadow-md'
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}>
                                    <Wrench className="w-7 h-7" />
                                </div>
                                <div className="flex-1 pr-6">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                            Manage My Equipment
                                        </h2>
                                        {mode === 'owner' && (
                                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-600 text-white">
                                                Active Mode
                                            </span>
                                        )}
                                        {ownerStats.pendingRequests > 0 && (
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                                                {ownerStats.pendingRequests} New
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed font-medium">
                                        List your machines, manage agricultural services, handle incoming booking requests and manage your equipment schedule.
                                    </p>
                                </div>
                            </div>

                            {/* Active subtle badge indicator */}
                            {mode === 'owner' && (
                                <div className="absolute top-4 right-4 text-amber-600 dark:text-amber-400">
                                    <CheckCircle2 className="w-5 h-5 fill-amber-600 text-white dark:fill-amber-400 dark:text-slate-900" />
                                </div>
                            )}
                        </button>
                    </div>
                </div>

                {/* ============================================================== */}
                {/* VIEW 1: RENT EQUIPMENT (RENTER EXPERIENCE)                      */}
                {/* ============================================================== */}
                {mode === 'rent' && (
                    <div className="space-y-6">
                        
                        {/* SUB-SECTION NAVIGATION */}
                        <div className="bg-white dark:bg-slate-850 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-start gap-2 overflow-x-auto">
                            <button
                                onClick={() => setRentTab('discover')}
                                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition flex-shrink-0 ${
                                    rentTab === 'discover'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <Compass className="w-4 h-4" />
                                <span>Discover Equipment</span>
                            </button>

                            <button
                                onClick={() => setRentTab('bookings')}
                                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition flex-shrink-0 ${
                                    rentTab === 'bookings'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <ClipboardList className="w-4 h-4" />
                                <span>My Bookings</span>
                                {renterBookings.length > 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                        rentTab === 'bookings'
                                            ? 'bg-emerald-800 text-white'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                                    }`}>
                                        {renterBookings.length}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setRentTab('calendar')}
                                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition flex-shrink-0 ${
                                    rentTab === 'calendar'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <Calendar className="w-4 h-4" />
                                <span>Booking Calendar</span>
                            </button>
                        </div>

                        {/* -------------------------------------------------------- */}
                        {/* SUB-SECTION 1: DISCOVER EQUIPMENT                        */}
                        {/* -------------------------------------------------------- */}
                        {rentTab === 'discover' && (
                            <div className="space-y-6">
                                
                                {/* Search & Category Filter Toolbar */}
                                <div className="bg-white dark:bg-slate-850 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                    
                                    {/* Search Bar + Sort Dropdown */}
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                        <div className="relative flex-1">
                                            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none shrink-0" />
                                            <input
                                                type="text"
                                                placeholder="Search by equipment, service task (e.g., Ploughing), village..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full !pl-11 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                                            />
                                            {searchQuery && (
                                                <button 
                                                    onClick={() => setSearchQuery("")}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <select
                                                value={proximityFilter}
                                                onChange={(e) => setProximityFilter(e.target.value)}
                                                className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <option value="all">Everywhere</option>
                                                {currentUser?.village && (
                                                    <option value="village">In My Village ({currentUser.village})</option>
                                                )}
                                                {currentUser?.district && (
                                                    <option value="district">In My District ({currentUser.district})</option>
                                                )}
                                            </select>

                                            <select
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                                className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            >
                                                <option value="recommended">Recommended</option>
                                                <option value="price_asc">Price: Low to High</option>
                                                <option value="price_desc">Price: High to Low</option>
                                                <option value="rating_desc">Highest Rated</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Category Chips Carousel with prominent 30-36px equipment illustrations */}
                                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-none">
                                        {CATEGORIES.map(cat => {
                                            const isActive = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                                            return (
                                                <button
                                                    key={cat.name}
                                                    type="button"
                                                    onClick={() => setSelectedCategory(cat.name)}
                                                    className={`px-3.5 py-1.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all shrink-0 border select-none min-h-[42px] ${
                                                        isActive 
                                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                                                            : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700 hover:bg-slate-100 hover:border-slate-300'
                                                    }`}
                                                >
                                                    {cat.name === 'All' ? (
                                                        <LayoutGrid 
                                                            className={`w-6 h-6 shrink-0 stroke-[2.2] ${isActive ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} 
                                                            style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px' }}
                                                        />
                                                    ) : (
                                                        <img 
                                                            src={cat.img} 
                                                            alt={cat.name} 
                                                            className="w-9 h-[26px] shrink-0 object-contain drop-shadow-xs" 
                                                            style={{ width: '36px', height: '26px', minWidth: '36px', minHeight: '26px', maxWidth: '36px', maxHeight: '26px' }}
                                                        />
                                                    )}
                                                    <span className="leading-none">{cat.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Machine Cards Grid */}
                                {loadingMachines ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {[1, 2, 3, 4, 5, 6].map(i => (
                                            <div key={i} className="h-72 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 animate-pulse"></div>
                                        ))}
                                    </div>
                                ) : filteredMachines.length === 0 ? (
                                    <EmptyState
                                        title="No Machinery Found"
                                        description="No equipment matches your search or filters. Try adjusting your search query or location settings."
                                        icon={Tractor}
                                        actionText="Reset Filters"
                                        onAction={() => {
                                            setSearchQuery("");
                                            setSelectedCategory("All");
                                            setProximityFilter("all");
                                        }}
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {filteredMachines.map(m => {
                                            const provider = m.user || m.provider || {};
                                            const img = getMachineImage(m);
                                            const isAvailable = m.available !== false;

                                            return (
                                                <div
                                                    key={m._id}
                                                    className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group"
                                                >
                                                    {/* Machine Image & Status */}
                                                    <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center p-4">
                                                        <img 
                                                            src={img} 
                                                            alt={m.name} 
                                                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                        
                                                        <div className="absolute top-3 left-3 flex items-center gap-2">
                                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 backdrop-blur-xs border border-slate-200/50">
                                                                {m.type}
                                                            </span>
                                                        </div>

                                                        <div className="absolute top-3 right-3">
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                                isAvailable
                                                                    ? 'bg-emerald-600 text-white shadow-xs'
                                                                    : 'bg-slate-500 text-white'
                                                            }`}>
                                                                {isAvailable ? 'Available' : 'Booked'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Machine Details */}
                                                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <h3 className="font-black text-base text-slate-900 dark:text-white truncate">
                                                                    {m.name}
                                                                </h3>
                                                                {m.rating ? (
                                                                    <div className="flex items-center gap-1 text-amber-500 font-black text-xs">
                                                                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                                                                        <span>{m.rating.toFixed(1)}</span>
                                                                        {m.ratingCount && (
                                                                            <span className="text-[10px] text-slate-400">({m.ratingCount})</span>
                                                                        )}
                                                                    </div>
                                                                ) : null}
                                                            </div>

                                                            {/* Provider and Location */}
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                                <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                                                <span className="truncate">
                                                                    {provider.village ? `${provider.village}, ` : ''}{provider.district || 'India'}
                                                                </span>
                                                            </div>

                                                            {/* Base Rate */}
                                                            <div className="pt-2 flex items-baseline gap-1">
                                                                <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                                                                    ₹{m.price}
                                                                </span>
                                                                <span className="text-xs text-slate-500 font-semibold">
                                                                    / {m.priceUnit || 'hour'}
                                                                </span>
                                                            </div>

                                                            {/* Tasks Preview */}
                                                            {Array.isArray(m.tasks) && m.tasks.length > 0 && (
                                                                <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                                                                    {m.tasks.slice(0, 2).map((task, idx) => (
                                                                        <span 
                                                                            key={idx}
                                                                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50"
                                                                        >
                                                                            {task.name} (₹{task.price})
                                                                        </span>
                                                                    ))}
                                                                    {m.tasks.length > 2 && (
                                                                        <span className="text-[10px] font-extrabold text-slate-400">
                                                                            +{m.tasks.length - 2} more
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Action Button */}
                                                        <div className="pt-2">
                                                            <button
                                                                onClick={() => navigate(`/rent/details/${m._id}`)}
                                                                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-1.5"
                                                            >
                                                                <span>View & Book Equipment</span>
                                                                <ChevronRight className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* -------------------------------------------------------- */}
                        {/* SUB-SECTION 2: MY BOOKINGS                               */}
                        {/* -------------------------------------------------------- */}
                        {rentTab === 'bookings' && (
                            <div className="space-y-6">
                                
                                {/* Status Filter Tabs */}
                                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                                    {[
                                        { id: 'all', label: 'All Bookings' },
                                        { id: 'pending', label: 'Pending Requests' },
                                        { id: 'confirmed', label: 'Confirmed' },
                                        { id: 'completed', label: 'Completed' },
                                        { id: 'cancelled', label: 'Cancelled' }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setRenterStatusFilter(tab.id)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                                                renterStatusFilter === tab.id
                                                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Booking Cards List */}
                                {loadingRenterBookings ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-32 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 animate-pulse"></div>
                                        ))}
                                    </div>
                                ) : filteredRenterBookings.length === 0 ? (
                                    <EmptyState
                                        title="No Bookings Found"
                                        description="You have no machinery bookings in this category. Explore available tractors and agricultural machinery to place a booking request."
                                        icon={ClipboardList}
                                        actionText="Discover Equipment"
                                        onAction={() => setRentTab('discover')}
                                    />
                                ) : (
                                    <div className="space-y-4">
                                        {filteredRenterBookings.map(b => {
                                            const provider = b.provider || {};
                                            const machine = b.machine || {};
                                            const isPending = b.status === 'pending';
                                            const isConfirmed = b.status === 'accepted' || b.status === 'confirmed';
                                            const isCompleted = b.status === 'completed';
                                            const isCancelled = b.status === 'cancelled' || b.status === 'rejected';

                                            return (
                                                <div 
                                                    key={b._id}
                                                    className="bg-white dark:bg-slate-850 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                                                >
                                                    <div className="flex items-start sm:items-center gap-4">
                                                        <img
                                                            src={machine.image || getMachineImage(machine)}
                                                            alt=""
                                                            className="w-16 h-16 rounded-2xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0"
                                                        />
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h4 className="font-black text-base text-slate-900 dark:text-white">
                                                                    {machine.name || "Machinery"}
                                                                </h4>
                                                                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                                                    isConfirmed 
                                                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300' 
                                                                        : isPending 
                                                                        ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300' 
                                                                        : isCompleted 
                                                                        ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300' 
                                                                        : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                                                                }`}>
                                                                    {b.status}
                                                                </span>
                                                            </div>

                                                            {/* Operation Task & Price */}
                                                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                                                                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                                                    {b.task?.name || "General Operation"}
                                                                </span>
                                                                <span>•</span>
                                                                <span>Date: <strong>{b.date ? new Date(b.date).toLocaleDateString() : 'N/A'}</strong></span>
                                                                {b.totalAmount && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span className="font-black text-slate-900 dark:text-white">Total: ₹{b.totalAmount}</span>
                                                                    </>
                                                                )}
                                                            </div>

                                                            {/* Provider Details */}
                                                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                                                <span>Owner: <strong>{provider.name || "Equipment Owner"}</strong></span>
                                                                {provider.village && (
                                                                    <span>({provider.village}, {provider.district})</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 flex-wrap">
                                                        {provider._id && (
                                                            <button
                                                                onClick={() => handleStartChat(provider._id)}
                                                                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                                                            >
                                                                <MessageSquare className="w-4 h-4 text-emerald-600" />
                                                                <span>Message Owner</span>
                                                            </button>
                                                        )}

                                                        {(isPending || isConfirmed) && (
                                                            <button
                                                                onClick={() => handleCancelBooking(b._id)}
                                                                className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold transition flex items-center gap-1.5 border border-rose-200/50"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                                <span>Cancel Booking</span>
                                                            </button>
                                                        )}

                                                        {isCompleted && !b.reviewed && (
                                                            <button
                                                                onClick={() => setSelectedBookingForReview(b)}
                                                                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-xs transition flex items-center gap-1.5"
                                                            >
                                                                <Star className="w-4 h-4 fill-white" />
                                                                <span>Rate & Review</span>
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

                        {/* -------------------------------------------------------- */}
                        {/* SUB-SECTION 3: RENTER BOOKING CALENDAR                   */}
                        {/* -------------------------------------------------------- */}
                        {rentTab === 'calendar' && (
                            <div className="space-y-4">
                                <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200/50 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 flex-shrink-0" />
                                    <span>
                                        This calendar displays only your personal machinery bookings. Click any highlighted date to review your equipment schedule.
                                    </span>
                                </div>

                                <BookingCalendar
                                    bookings={renterBookings}
                                    role="renter"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* ============================================================== */}
                {/* VIEW 2: MANAGE MY EQUIPMENT (OWNER EXPERIENCE)                 */}
                {/* ============================================================== */}
                {mode === 'owner' && (
                    <div className="space-y-6">
                        
                        {/* 1. OVERVIEW STATISTICS BANNER */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                            
                            {/* Card 1: Total Listed */}
                            <div className="bg-white dark:bg-slate-850 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Total Listed
                                </span>
                                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                                    {ownerStats.totalListed}
                                </div>
                                <span className="text-[11px] text-slate-500 font-medium">In your fleet</span>
                            </div>

                            {/* Card 2: Active Listings */}
                            <div className="bg-white dark:bg-slate-850 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Active Listings
                                </span>
                                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                                    {ownerStats.activeListings}
                                </div>
                                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Visible to farmers</span>
                            </div>

                            {/* Card 3: Available Now */}
                            <div className="bg-white dark:bg-slate-850 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Available Now
                                </span>
                                <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                                    {ownerStats.availableNow}
                                </div>
                                <span className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">Ready for bookings</span>
                            </div>

                            {/* Card 4: Incoming Requests */}
                            <div className={`p-4 rounded-3xl border shadow-xs ${
                                ownerStats.pendingRequests > 0 
                                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700' 
                                    : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800'
                            }`}>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                                    Incoming Requests
                                </span>
                                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                                    {ownerStats.pendingRequests}
                                </div>
                                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Awaiting response</span>
                            </div>

                            {/* Card 5: Confirmed Bookings */}
                            <div className="bg-white dark:bg-slate-850 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Confirmed Jobs
                                </span>
                                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                                    {ownerStats.confirmedBookings}
                                </div>
                                <span className="text-[11px] text-slate-500 font-medium">Scheduled operations</span>
                            </div>
                        </div>

                        {/* 2. SUB-SECTION NAVIGATION */}
                        <div className="bg-white dark:bg-slate-850 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setOwnerTab('fleet')}
                                    className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition flex-shrink-0 ${
                                        ownerTab === 'fleet'
                                            ? 'bg-amber-600 text-white shadow-sm'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <Tractor className="w-4 h-4" />
                                    <span>My Equipment Fleet</span>
                                    {ownerMachines.length > 0 && (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                            ownerTab === 'fleet' ? 'bg-amber-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700'
                                        }`}>
                                            {ownerMachines.length}
                                        </span>
                                    )}
                                </button>

                                <button
                                    onClick={() => setOwnerTab('requests')}
                                    className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition flex-shrink-0 ${
                                        ownerTab === 'requests'
                                            ? 'bg-amber-600 text-white shadow-sm'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <ClipboardList className="w-4 h-4" />
                                    <span>Booking Requests</span>
                                    {ownerRequests.length > 0 && (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                            ownerTab === 'requests' ? 'bg-amber-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700'
                                        }`}>
                                            {ownerRequests.length}
                                        </span>
                                    )}
                                </button>

                                <button
                                    onClick={() => setOwnerTab('calendar')}
                                    className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition flex-shrink-0 ${
                                        ownerTab === 'calendar'
                                            ? 'bg-amber-600 text-white shadow-sm'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <Calendar className="w-4 h-4" />
                                    <span>Equipment Schedule Calendar</span>
                                </button>
                            </div>

                            {/* PROMINENT LIST MACHINE BUTTON */}
                            <button
                                onClick={() => navigate("/add-machine")}
                                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black shadow-md transition flex items-center gap-2 flex-shrink-0"
                            >
                                <PlusCircle className="w-4 h-4" />
                                <span>List New Machine</span>
                            </button>
                        </div>

                        {/* -------------------------------------------------------- */}
                        {/* SUB-SECTION 1: MY EQUIPMENT FLEET                        */}
                        {/* -------------------------------------------------------- */}
                        {ownerTab === 'fleet' && (
                            <div className="space-y-6">
                                {loadingOwnerMachines ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[1, 2].map(i => (
                                            <div key={i} className="h-44 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 animate-pulse"></div>
                                        ))}
                                    </div>
                                ) : ownerMachines.length === 0 ? (
                                    <EmptyState
                                        title="No Equipment Listed Yet"
                                        description="You have not listed any tractors, harvesters or machinery for rent. List your equipment now to earn by providing agricultural services."
                                        icon={Tractor}
                                        actionText="List New Machine"
                                        onAction={() => navigate("/add-machine")}
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {ownerMachines.map(m => {
                                            const isAvailable = m.available !== false;

                                            return (
                                                <div 
                                                    key={m._id}
                                                    className="bg-white dark:bg-slate-850 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <img
                                                            src={m.image || getMachineImage(m)}
                                                            alt={m.name}
                                                            className="w-20 h-20 rounded-2xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0"
                                                        />
                                                        <div className="space-y-1 flex-1">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <h4 className="font-black text-base text-slate-900 dark:text-white truncate">
                                                                    {m.name}
                                                                </h4>
                                                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                                    {m.type}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                <span>Base Rate: <strong>₹{m.price} / {m.priceUnit || 'hr'}</strong></span>
                                                                {m.condition && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span>Condition: {m.condition}</span>
                                                                    </>
                                                                )}
                                                            </div>

                                                            {/* Availability Toggle Switch */}
                                                            <div className="pt-2 flex items-center justify-between">
                                                                <button
                                                                    type="button"
                                                                    role="switch"
                                                                    aria-checked={isAvailable}
                                                                    onClick={() => handleToggleAvailability(m._id, isAvailable)}
                                                                    className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all select-none group min-h-[38px]"
                                                                    title={isAvailable ? "Click to mark listing as unavailable" : "Click to mark listing as available"}
                                                                >
                                                                    <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 flex items-center shrink-0 ${
                                                                        isAvailable ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                                                                    }`}>
                                                                        <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-xs transform transition-transform duration-200 ${
                                                                            isAvailable ? 'translate-x-3.5' : 'translate-x-0'
                                                                        }`} />
                                                                    </div>
                                                                    <span className={`text-xs font-bold tracking-tight ${
                                                                        isAvailable ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                                                                    }`}>
                                                                        {isAvailable ? 'Listing Available' : 'Listing Unavailable'}
                                                                    </span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Tasks List */}
                                                    {Array.isArray(m.tasks) && m.tasks.length > 0 && (
                                                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                            <span className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
                                                                Configured Agricultural Services
                                                            </span>
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                {m.tasks.map((task, idx) => (
                                                                    <span 
                                                                        key={idx}
                                                                        className="text-xs font-bold px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                                                                    >
                                                                        {task.name}: ₹{task.price}/{task.priceUnit || 'hr'}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Actions Row: Details & Schedule is the single entry point for viewing and managing machine services, bookings and calendar schedule */}
                                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => navigate(`/manage-machine/${m._id}`, { state: { machine: m } })}
                                                            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 min-h-[40px] border border-slate-200/80 dark:border-slate-700"
                                                            title="View and manage agricultural services/tasks, incoming requests, and equipment calendar schedule"
                                                        >
                                                            <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
                                                            <span>Details & Schedule</span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteMachine(m._id, m.name)}
                                                            className="p-2.5 rounded-xl border border-rose-200/80 dark:border-rose-900/40 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
                                                            title="Delete Listing"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* -------------------------------------------------------- */}
                        {/* SUB-SECTION 2: BOOKING REQUESTS                          */}
                        {/* -------------------------------------------------------- */}
                        {ownerTab === 'requests' && (
                            <div className="space-y-6">
                                
                                {/* Status Filter Tabs */}
                                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                                    {[
                                        { id: 'all', label: 'All Requests' },
                                        { id: 'pending', label: 'Pending Approval' },
                                        { id: 'confirmed', label: 'Confirmed Jobs' },
                                        { id: 'completed', label: 'Completed' },
                                        { id: 'cancelled', label: 'Rejected / Cancelled' }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setOwnerStatusFilter(tab.id)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                                                ownerStatusFilter === tab.id
                                                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Requests Cards List */}
                                {loadingOwnerRequests ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-32 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 animate-pulse"></div>
                                        ))}
                                    </div>
                                ) : filteredOwnerRequests.length === 0 ? (
                                    <EmptyState
                                        title="No Booking Requests"
                                        description="You have no incoming booking requests in this category. When farmers book your equipment, requests will appear here for your confirmation."
                                        icon={ClipboardList}
                                    />
                                ) : (
                                    <div className="space-y-4">
                                        {filteredOwnerRequests.map(b => {
                                            const farmer = b.farmer || {};
                                            const machine = b.machine || {};
                                            const isPending = b.status === 'pending';
                                            const isConfirmed = b.status === 'accepted' || b.status === 'confirmed';
                                            const isCompleted = b.status === 'completed';
                                            const isCancelled = b.status === 'cancelled' || b.status === 'rejected';

                                            return (
                                                <div 
                                                    key={b._id}
                                                    className="bg-white dark:bg-slate-850 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
                                                >
                                                    <div className="flex items-start sm:items-center gap-4">
                                                        <img
                                                            src={machine.image || getMachineImage(machine)}
                                                            alt=""
                                                            className="w-16 h-16 rounded-2xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0"
                                                        />
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h4 className="font-black text-base text-slate-900 dark:text-white">
                                                                    {machine.name}
                                                                </h4>
                                                                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                                                    isConfirmed 
                                                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300' 
                                                                        : isPending 
                                                                        ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300' 
                                                                        : isCompleted 
                                                                        ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300' 
                                                                        : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                                                                }`}>
                                                                    {b.status}
                                                                </span>
                                                            </div>

                                                            {/* Renter Details */}
                                                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                                                                <span>Renter: <strong className="text-slate-900 dark:text-white">{farmer.name || "Farmer"}</strong></span>
                                                                {farmer.village && (
                                                                    <span>({farmer.village}, {farmer.district})</span>
                                                                )}
                                                                {farmer.phone && (
                                                                    <a href={`tel:${farmer.phone}`} className="text-emerald-600 font-bold hover:underline">
                                                                        {farmer.phone}
                                                                    </a>
                                                                )}
                                                            </div>

                                                            {/* Task & Date */}
                                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                                                                <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/50">
                                                                    {b.task?.name || "General Operation"}
                                                                </span>
                                                                <span>•</span>
                                                                <span>Date: <strong>{b.date ? new Date(b.date).toLocaleDateString() : 'N/A'}</strong></span>
                                                                <span>•</span>
                                                                <span>Duration: {b.duration || 1} hr</span>
                                                                {b.totalAmount && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span className="font-black text-slate-900 dark:text-white">Amount: ₹{b.totalAmount}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Owner Action Buttons */}
                                                    <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 flex-wrap">
                                                        {farmer._id && (
                                                            <button
                                                                onClick={() => handleStartChat(farmer._id)}
                                                                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                                                            >
                                                                <MessageSquare className="w-4 h-4 text-emerald-600" />
                                                                <span>Message</span>
                                                            </button>
                                                        )}

                                                        {isPending && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleOwnerStatusUpdate(b._id, 'accepted')}
                                                                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                                                                >
                                                                    <Check className="w-4 h-4 stroke-[2.5]" />
                                                                    <span>Accept Request</span>
                                                                </button>

                                                                <button
                                                                    onClick={() => handleOwnerStatusUpdate(b._id, 'rejected')}
                                                                    className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold transition flex items-center gap-1.5 border border-rose-200/50"
                                                                >
                                                                    <X className="w-4 h-4 stroke-[2.5]" />
                                                                    <span>Reject</span>
                                                                </button>
                                                            </>
                                                        )}

                                                        {isConfirmed && (
                                                            <button
                                                                onClick={() => handleOwnerStatusUpdate(b._id, 'completed')}
                                                                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition flex items-center gap-1.5 shadow-sm"
                                                            >
                                                                <CheckCircle className="w-4 h-4 stroke-[2.2]" />
                                                                <span>Mark Rental Completed</span>
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

                        {/* -------------------------------------------------------- */}
                        {/* SUB-SECTION 3: OWNER EQUIPMENT SCHEDULE CALENDAR         */}
                        {/* -------------------------------------------------------- */}
                        {ownerTab === 'calendar' && (
                            <div className="space-y-4">
                                <div className="bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200/50 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 flex-shrink-0" />
                                    <span>
                                        This calendar represents your equipment schedule across all your listed machinery. Click any highlighted date to manage customer booking schedules.
                                    </span>
                                </div>

                                <BookingCalendar
                                    bookings={ownerRequests}
                                    role="owner"
                                    onStatusUpdate={handleOwnerStatusUpdate}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Review Modal for Renter */}
            {selectedBookingForReview && (
                <ReviewModal
                    isOpen={Boolean(selectedBookingForReview)}
                    onClose={() => setSelectedBookingForReview(null)}
                    booking={selectedBookingForReview}
                    onReviewSubmitted={(bookingId) => {
                        setRenterBookings(prev => prev.map(b => b._id === bookingId ? { ...b, reviewed: true } : b));
                    }}
                />
            )}
        </div>
    );
};

export default RentMachineryWorkspace;
