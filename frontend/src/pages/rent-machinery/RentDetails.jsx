import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../utils/api";
import Swal from "sweetalert2";
import { 
    MapPin, User, Phone, ClipboardList, CalendarCheck, CheckCircle2, 
    MessageSquare, Star, Sparkles, Wrench, Calendar, Clock, 
    ShieldCheck, AlertCircle, IndianRupee, Layers, Check 
} from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/common/PageHeader";

const RentDetails = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    const [machine, setMachine] = useState(location.state?.machine || null);
    const [loadingMachine, setLoadingMachine] = useState(!location.state?.machine);
    const [currentUser, setCurrentUser] = useState(null);

    // Booking state
    const [date, setDate] = useState("");
    const [duration, setDuration] = useState(1);
    const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Reviews & Availability state
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [bookedDates, setBookedDates] = useState([]);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try { setCurrentUser(JSON.parse(userStr)); } catch (e) {}
        }
    }, []);

    // Fetch Machine if opened via direct URL
    useEffect(() => {
        const machineId = machine?._id || id;
        if (!machine && machineId) {
            setLoadingMachine(true);
            api.get(`/machines/detail/${machineId}`)
                .then(res => setMachine(res.data))
                .catch(err => console.error("Error fetching machine details:", err))
                .finally(() => setLoadingMachine(false));
        }
    }, [id, machine]);

    // Fetch Reviews & Booked Dates for this machine
    useEffect(() => {
        const machineId = machine?._id || id;
        if (machineId) {
            api.get(`/reviews/machine/${machineId}`)
                .then(res => setReviews(Array.isArray(res.data) ? res.data : []))
                .catch(err => console.error("Failed to load reviews:", err))
                .finally(() => setLoadingReviews(false));

            api.get(`/bookings/machine/${machineId}`)
                .then(res => {
                    const list = Array.isArray(res.data) ? res.data : [];
                    const formatted = list.map(b => new Date(b.date).toISOString().split('T')[0]);
                    setBookedDates(formatted);
                })
                .catch(err => console.error("Failed to load booked dates:", err));
        }
    }, [machine, id]);

    if (loadingMachine) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-slate-500 text-sm font-semibold">Loading machinery specifications...</p>
                </div>
            </div>
        );
    }

    if (!machine) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex items-center justify-center">
                <div className="text-center max-w-md bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Machine Not Found</h2>
                    <p className="text-sm text-slate-500 mb-6">This machinery listing may have been unlisted or removed by the owner.</p>
                    <button
                        onClick={() => navigate("/rent/list/all")}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md"
                    >
                        Browse All Machinery
                    </button>
                </div>
            </div>
        );
    }

    // Owner check
    const isOwner = currentUser && machine.user && (
        String(currentUser._id || currentUser.id) === String(machine.user._id || machine.user)
    );

    // List of operations/tasks
    const availableTasks = (machine.tasks && machine.tasks.length > 0)
        ? machine.tasks
        : [{ name: "Standard Operation", price: machine.price, priceUnit: machine.priceUnit || "hour", available: true }];

    const activeTask = availableTasks[selectedTaskIndex] || availableTasks[0];
    const estimatedTotal = (Number(activeTask?.price) || Number(machine.price) || 0) * (Number(duration) || 1);

    const isSelectedDateBooked = date && bookedDates.includes(date);

    const handleBook = async (e) => {
        e.preventDefault();
        if (isOwner) return;

        if (isSelectedDateBooked) {
            Swal.fire({
                title: 'Date Unavailable',
                text: 'This machine is already reserved on the selected date. Please choose another date.',
                icon: 'warning',
                confirmButtonColor: '#eab308'
            });
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const payload = {
                machineId: machine._id,
                date,
                duration: Number(duration) || 1,
                task: {
                    name: activeTask.name,
                    price: Number(activeTask.price) || machine.price,
                    priceUnit: activeTask.priceUnit || machine.priceUnit || "hour"
                },
                notes
            };

            await api.post("/bookings/book", payload, {
                headers: { "auth-token": token }
            });

            await Swal.fire({
                title: 'Booking Request Sent! 🚜',
                text: `Requested ${machine.name} for ${activeTask.name} on ${new Date(date).toLocaleDateString()}`,
                icon: 'success',
                confirmButtonColor: '#16a34a',
                confirmButtonText: 'View My Bookings',
                showCancelButton: true,
                cancelButtonText: 'Stay Here'
            }).then((res) => {
                if (res.isConfirmed) {
                    navigate("/my-bookings");
                }
            });

        } catch (err) {
            console.error(err);
            Swal.fire({
                title: 'Booking Request Failed',
                text: err.response?.data?.message || "Something went wrong while booking.",
                icon: 'error',
                confirmButtonColor: '#d33'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleStartChat = async () => {
        try {
            const token = localStorage.getItem("token");
            const targetUserId = machine.user._id || machine.user;
            await api.post("/chat/conversations", {
                participantIds: [targetUserId],
                isGroup: false
            }, { headers: { "auth-token": token } });
            
            navigate("/messages");
        } catch (err) {
            Swal.fire("Error", "Could not start chat conversation", "error");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            <PageHeader 
                title={machine.name} 
                backTo="/rent/list/all" 
            />

            <div className="max-w-5xl mx-auto px-4 mt-6 space-y-8">
                
                {/* Hero Showcase */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left: Photos & Specs */}
                    <div className="lg:col-span-7 space-y-6">
                        
                        <div className="w-full h-72 sm:h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm relative border border-slate-200 dark:border-slate-800">
                            <img
                                src={machine.image}
                                alt={machine.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider">
                                {machine.type}
                            </div>

                            <div className="absolute top-4 right-4 bg-emerald-600/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white shadow-xs flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                                <span>{machine.available !== false ? 'Available' : 'Booked'}</span>
                            </div>

                            {machine.ratingCount > 0 && (
                                <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-md flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                    <span>{machine.rating.toFixed(1)}</span>
                                    <span className="text-slate-400 font-normal">({machine.ratingCount} verified reviews)</span>
                                </div>
                            )}
                        </div>

                        {/* Description & Specifications Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                    <ClipboardList className="w-5 h-5 text-emerald-600" />
                                    <span>Machinery Specifications & Condition</span>
                                </h3>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <span className="text-[11px] text-slate-400 uppercase font-bold block">Condition</span>
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{machine.condition || "Good"}</span>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <span className="text-[11px] text-slate-400 uppercase font-bold block">Model Year</span>
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{machine.modelYear || "2023"}</span>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 col-span-2 sm:col-span-1">
                                        <span className="text-[11px] text-slate-400 uppercase font-bold block">Category</span>
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{machine.type}</span>
                                    </div>
                                </div>

                                {machine.specs && (
                                    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-300">
                                        <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">Equipment Details:</span>
                                        <p>{machine.specs}</p>
                                    </div>
                                )}

                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
                                    {machine.description || "Reliable farm machinery available for seasonal or daily agricultural operations."}
                                </p>
                            </div>

                            {/* Owner Info Bar */}
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm overflow-hidden flex-shrink-0">
                                        {machine.user?.profileImage ? (
                                            <img src={machine.user.profileImage} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            (machine.user?.name || "O")[0]?.toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-slate-900 dark:text-white text-base">
                                                {machine.user?.name || "Local Machine Owner"}
                                            </span>
                                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>{[machine.user?.village, machine.user?.mandal, machine.user?.district].filter(Boolean).join(", ") || "Farm Location"}</span>
                                        </p>
                                    </div>
                                </div>

                                {!isOwner && (
                                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                        {machine.user?.phone && (
                                            <a 
                                                href={`tel:${machine.user.phone}`} 
                                                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5 transition"
                                            >
                                                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Call</span>
                                            </a>
                                        )}
                                        <button 
                                            onClick={handleStartChat} 
                                            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 transition shadow-sm"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            <span>Chat</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Verified Ratings & Reviews Section */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                        <span>Verified Farmer Reviews</span>
                                    </h3>
                                    <p className="text-xs text-slate-500">Reviews submitted only after verified completed bookings</p>
                                </div>
                                {machine.ratingCount > 0 && (
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-amber-500">{machine.rating.toFixed(1)}</span>
                                        <span className="text-xs text-slate-400 block">/ 5.0 rating</span>
                                    </div>
                                )}
                            </div>

                            {loadingReviews ? (
                                <div className="text-center py-6 text-xs text-slate-400">Loading reviews...</div>
                            ) : reviews.length === 0 ? (
                                <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500">
                                    No reviews submitted yet for this machinery. Once a booking is completed, the renter can leave a verified rating.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map((rev) => (
                                        <div 
                                            key={rev._id} 
                                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                                                        {rev.renter?.name ? rev.renter.name[0] : 'F'}
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                                            {rev.renter?.name || "Verified Farmer"}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {rev.renter?.village ? `${rev.renter.village} • ` : ""}{new Date(rev.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                                                    <Star className="w-3.5 h-3.5 fill-current" />
                                                    <span>{rev.rating}</span>
                                                </div>
                                            </div>

                                            {rev.comment && (
                                                <p className="text-xs text-slate-600 dark:text-slate-300 pl-9">
                                                    "{rev.comment}"
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Right: Operations & Booking Widget */}
                    <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                        
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-200/90 dark:border-slate-800 space-y-6">
                            
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                    Select Agricultural Operation
                                </h3>
                                <p className="text-xs text-slate-500 mb-4">Choose the specific farming task needed</p>

                                {/* Tasks selector pills */}
                                <div className="space-y-2">
                                    {availableTasks.map((t, idx) => {
                                        const isSelected = selectedTaskIndex === idx;
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setSelectedTaskIndex(idx)}
                                                className={`w-full p-3.5 rounded-2xl text-left border transition flex items-center justify-between ${
                                                    isSelected 
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs' 
                                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                                        isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                                                    }`}>
                                                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100 block">
                                                            {t.name}
                                                        </span>
                                                        {t.description && (
                                                            <span className="text-[11px] text-slate-500 block">{t.description}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                                                        ₹{t.price}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 block font-bold uppercase">
                                                        /{t.priceUnit || 'hr'}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Booking Form */}
                            <form onSubmit={handleBook} className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        Booking Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split("T")[0]}
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    {isSelectedDateBooked && (
                                        <p className="text-xs text-amber-600 font-semibold mt-1.5 flex items-center gap-1">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            <span>Already reserved on this date. Select another date.</span>
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        Quantity / Duration ({activeTask.priceUnit === 'acre' ? 'Acres' : activeTask.priceUnit === 'day' ? 'Days' : 'Hours'}) *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="500"
                                        required
                                        value={duration}
                                        onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        Work Notes / Farm Directions
                                    </label>
                                    <textarea
                                        rows="2"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="E.g., 4 acres black soil land near village pond, start morning 6 AM..."
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                    ></textarea>
                                </div>

                                {/* Agreed Estimated Total */}
                                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold block">Estimated Amount:</span>
                                        <span className="text-[11px] text-slate-500">
                                            ₹{activeTask.price} × {duration} {activeTask.priceUnit || 'hr'}s
                                        </span>
                                    </div>
                                    <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                                        ₹{estimatedTotal}
                                    </span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isOwner || submitting || isSelectedDateBooked}
                                    className={`w-full py-4 rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition ${
                                        isOwner 
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border' 
                                            : isSelectedDateBooked
                                            ? 'bg-amber-400 text-white cursor-not-allowed'
                                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                                    }`}
                                >
                                    {isOwner ? (
                                        <span>You Own This Machine</span>
                                    ) : submitting ? (
                                        <span>Sending Booking Request...</span>
                                    ) : (
                                        <>
                                            <CalendarCheck className="w-5 h-5" />
                                            <span>Request Booking</span>
                                        </>
                                    )}
                                </button>
                            </form>

                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
};

export default RentDetails;
