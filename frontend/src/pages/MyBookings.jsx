import { useEffect, useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Check, X, Clock, User, Phone, Trash2, AlertCircle, CheckCircle2, History, Archive } from "lucide-react";
import Swal from "sweetalert2";

const MyBookings = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("active"); // 'active' (Upcoming) or 'history' (Past/Rejected)
    const [currentUser, setCurrentUser] = useState(null);

    // 1. Fetch & Sort Bookings
    const fetchBookings = async () => {
        try {
            const token = localStorage.getItem("token");
            const userStr = localStorage.getItem("user");
            if (userStr) setCurrentUser(JSON.parse(userStr));

            const { data } = await api.get("/bookings/fetchall", {
                headers: { "auth-token": token }
            });
            setBookings(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    // 2. Status Update (Accept/Reject)
    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const token = localStorage.getItem("token");
            await api.put(`/bookings/status/${id}`, { status: newStatus }, {
                headers: { "auth-token": token }
            });
            fetchBookings();
            Swal.fire({
                icon: 'success',
                title: `Request ${newStatus === 'confirmed' ? 'Accepted' : 'Rejected'}`,
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            Swal.fire("Error", "Action failed", "error");
        }
    };

    // 3. Delete Booking (Cleanup)
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Record?',
            text: "Remove this from your history?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                await api.delete(`/bookings/delete/${id}`, { headers: { "auth-token": token } });
                setBookings(prev => prev.filter(b => b._id !== id));
                Swal.fire("Deleted", "Record removed.", "success");
            } catch (err) {
                Swal.fire("Error", "Could not delete", "error");
            }
        }
    };

    // 4. Smart Filtering Logic
    const processBookings = () => {
        if (!currentUser) return { active: [], history: [] };

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to midnight for fair comparison

        const activeList = [];
        const historyList = [];

        bookings.forEach(booking => {
            const bookingDate = new Date(booking.date);
            const isPast = bookingDate < today;

            // Determine "Real" Status
            let displayStatus = booking.status;

            if (booking.status === 'rejected') {
                displayStatus = 'rejected';
            } else if (isPast) {
                if (booking.status === 'confirmed') displayStatus = 'completed';
                else if (booking.status === 'pending') displayStatus = 'expired';
            }

            // Attach computed status to object
            const processedBooking = { ...booking, displayStatus, isPast };

            // Categorize
            if (displayStatus === 'completed' || displayStatus === 'expired' || displayStatus === 'rejected') {
                historyList.push(processedBooking);
            } else {
                // Pending or Confirmed (Future)
                activeList.push(processedBooking);
            }
        });

        return { active: activeList, history: historyList };
    };

    const { active: activeData, history: historyData } = processBookings();
    const currentList = activeTab === "active" ? activeData : historyData;

    // Visual Badges
    const getStatusBadge = (status) => {
        switch (status) {
            case 'confirmed': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-green-200"><CheckCircle2 className="w-3 h-3" /> Accepted</span>;
            case 'completed': return <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-blue-200"><Check className="w-3 h-3" /> Completed</span>;
            case 'rejected': return <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-red-200"><X className="w-3 h-3" /> Rejected</span>;
            case 'expired': return <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-gray-200"><AlertCircle className="w-3 h-3" /> Expired</span>;
            default: return <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-yellow-200 animate-pulse"><Clock className="w-3 h-3" /> Pending</span>;
        }
    };

    return (
        <div className="w-full">

            {/* Header */}
            <div className="bg-white px-6 py-6 shadow-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => navigate("/rent-machinery")} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">My Bookings</h1>
                    </div>

                    {/* Modern Tabs */}
                    <div className="flex bg-gray-100 p-1.5 rounded-xl w-full max-w-sm">
                        <button
                            onClick={() => setActiveTab("active")}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'active' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Calendar className="w-4 h-4" /> Active <span className="bg-gray-200 text-gray-600 text-[10px] px-1.5 rounded-full ml-1">{activeData.length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'history' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <History className="w-4 h-4" /> History <span className="bg-gray-200 text-gray-600 text-[10px] px-1.5 rounded-full ml-1">{historyData.length}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 mt-6 pb-20">
                {loading ? (
                    <div className="space-y-4">{[1, 2].map(i => <div key={i} className="h-32 bg-white rounded-xl animate-pulse"></div>)}</div>
                ) : currentList.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                        <Archive className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">
                            {activeTab === 'active' ? "No upcoming bookings." : "History is clean."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {currentList.map(item => {
                            // Identify Role
                            const isProvider = currentUser && String(item.provider?._id || item.provider) === String(currentUser._id || currentUser.id);

                            return (
                                <div key={item._id} className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-5 transition hover:shadow-md
                                ${item.displayStatus === 'expired' || item.displayStatus === 'rejected' ? 'opacity-75 grayscale-[0.5]' : ''}`}>

                                    {/* Image & Date */}
                                    <div className="flex flex-row md:flex-col gap-4 md:w-32 flex-shrink-0">
                                        <div className="w-24 h-24 md:w-32 md:h-24 bg-gray-100 rounded-xl overflow-hidden">
                                            <img src={item.machine?.image} alt="Machine" className="w-full h-full object-cover" />
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-800">{item.machine?.name}</h3>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                    <span className="font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{new Date(item.date).toDateString()}</span>
                                                    <span>•</span>
                                                    <span>{item.machine?.type}</span>
                                                </div>
                                            </div>
                                            {getStatusBadge(item.displayStatus)}
                                        </div>

                                        {/* Notes Bubble */}
                                        {item.notes && (
                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm text-gray-600 italic mb-3">
                                                "{item.notes}"
                                            </div>
                                        )}

                                        {/* Contact & Context */}
                                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                                            <div className="flex items-center gap-3 text-sm">
                                                {isProvider ? (
                                                    <>
                                                        <span className="text-gray-500 text-xs uppercase font-bold">Request By</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-gray-800">{item.farmer?.name}</span>
                                                            <a href={`tel:${item.farmer?.phone}`} className="bg-green-50 text-green-700 p-1.5 rounded-full hover:bg-green-100"><Phone className="w-3 h-3" /></a>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-gray-500 text-xs uppercase font-bold">Owner</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-gray-800">{item.provider?.name}</span>
                                                            <a href={`tel:${item.provider?.phone}`} className="bg-blue-50 text-blue-700 p-1.5 rounded-full hover:bg-blue-100"><Phone className="w-3 h-3" /></a>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                {/* Provider Actions for Pending Items */}
                                                {isProvider && item.displayStatus === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleStatusUpdate(item._id, 'confirmed')} className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow hover:bg-green-700">Accept</button>
                                                        <button onClick={() => handleStatusUpdate(item._id, 'rejected')} className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-bold border border-red-200">Reject</button>
                                                    </>
                                                )}

                                                {/* Delete Button (Only for History Tab) */}
                                                {activeTab === 'history' && (
                                                    <button onClick={() => handleDelete(item._id)} className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg transition" title="Remove Record">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
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

export default MyBookings;