import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../utils/api";
import Swal from "sweetalert2"; // Enhanced Alerts
import { ArrowLeft, Trash2, Check, X, Calendar, User } from "lucide-react";
import { useTranslation } from "react-i18next"; // 1. Import

const ManageMachine = () => {
    const { t } = useTranslation(); // 2. Hook
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [machine, setMachine] = useState(location.state?.machine || null);
    const [bookings, setBookings] = useState([]);
    const [filter, setFilter] = useState("pending");

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("token");
            try {
                if (!machine) {
                    const machineRes = await api.get("/machines/fetchall", { headers: { "auth-token": token } });
                    const foundMachine = machineRes.data.find(m => m._id === id);
                    setMachine(foundMachine);
                }

                const { data } = await api.get("/bookings/fetchall", { headers: { "auth-token": token } });
                const relevant = data.filter(b => b.machine?._id === id);
                setBookings(relevant);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [id]);

    const handleStatus = async (bookingId, status) => {
        // ✨ CONFIRMATION POPUP ✨
        const result = await Swal.fire({
            title: status === 'confirmed' ? (t('manage.accept') + '?') : (t('manage.reject') + '?'),
            text: status === 'confirmed' ? "The farmer will be notified to pay." : "This request will be removed.",
            icon: status === 'confirmed' ? 'question' : 'warning',
            showCancelButton: true,
            confirmButtonColor: status === 'confirmed' ? '#16a34a' : '#d33',
            confirmButtonText: status === 'confirmed' ? t('manage.accept') : t('manage.reject'),
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                await api.put(`/bookings/status/${bookingId}`, { status }, { headers: { "auth-token": token } });

                setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status } : b));

                // ✨ SUCCESS TOAST ✨
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.addEventListener('mouseenter', Swal.stopTimer)
                        toast.addEventListener('mouseleave', Swal.resumeTimer)
                    }
                })

                Toast.fire({
                    icon: 'success',
                    title: `Booking ${status} successfully`
                })

            } catch (err) {
                Swal.fire("Error", "Could not update status", "error");
            }
        }
    };

    const displayList = bookings.filter(b => {
        if (filter === 'pending') return b.status === 'pending';
        if (filter === 'confirmed') return b.status === 'confirmed';
        return ['rejected', 'completed'].includes(b.status);
    });

    if (!machine) return <div className="text-center mt-20">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white p-4 sticky top-0 z-10 shadow-sm border-b border-gray-100">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate("/my-machines")} className="p-2 hover:bg-gray-100 rounded-full">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="font-bold text-lg text-gray-800">{machine.name}</h1>
                            <p className="text-xs text-gray-500">{t('manage.title')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-4xl mx-auto p-4">
                <div className="flex bg-white p-1 rounded-xl shadow-sm mb-4">
                    {['pending', 'confirmed', 'history'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg capitalize transition ${filter === f ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            {/* Dynamically translate 'pending', 'confirmed', 'history' */}
                            {t(`manage.${f}`, { defaultValue: f })}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="space-y-3">
                    {displayList.length === 0 ? (
                        <p className="text-center text-gray-400 mt-10">No {filter} bookings.</p>
                    ) : (
                        displayList.map(b => (
                            <div key={b._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{b.farmer?.name || "Farmer"}</p>
                                            <a href={`tel:${b.farmer?.phone}`} className="text-xs text-blue-600 hover:underline">{b.farmer?.phone}</a>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 text-xs font-bold bg-gray-100 px-2 py-1 rounded">
                                            <Calendar className="w-3 h-3" /> {new Date(b.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                {b.notes && <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mb-3">"{b.notes}"</p>}

                                {b.status === 'pending' && (
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => handleStatus(b._id, 'confirmed')} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 hover:bg-green-700 transition">
                                            <Check className="w-4 h-4" /> {t('manage.accept')}
                                        </button>
                                        <button onClick={() => handleStatus(b._id, 'rejected')} className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 border border-red-100 hover:bg-red-100 transition">
                                            <X className="w-4 h-4" /> {t('manage.reject')}
                                        </button>
                                    </div>
                                )}

                                {b.status === 'confirmed' && (
                                    <div className="mt-2 text-center text-xs font-bold text-green-600 bg-green-50 py-2 rounded border border-green-100">
                                        {t('manage.confirmed_msg')}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageMachine;