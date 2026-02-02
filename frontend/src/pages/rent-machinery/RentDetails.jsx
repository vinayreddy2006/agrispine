import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import Swal from "sweetalert2";
import { ArrowLeft, MapPin, User, Phone, ClipboardList, CalendarCheck, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next"; // 1. Import Hook

const RentDetails = () => {
    const { t } = useTranslation(); // 2. Initialize Hook
    const navigate = useNavigate();
    const location = useLocation();
    const machine = location.state?.machine;
    const [date, setDate] = useState("");
    const [notes, setNotes] = useState("");
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) setCurrentUser(JSON.parse(userStr));
    }, [machine]);

    if (!machine) return null;

    // Check if current user is the owner of the machine
    const isOwner = currentUser && machine.user && (String(currentUser._id || currentUser.id) === String(machine.user._id || machine.user));

    const handleBook = async (e) => {
        e.preventDefault();
        if (isOwner) return;

        try {
            const token = localStorage.getItem("token");
            await api.post("/bookings/book", {
                machineId: machine._id,
                date,
                notes
            }, { headers: { "auth-token": token } });

            Swal.fire({
                title: 'Request Sent!',
                text: `You requested this ${machine.type} for ${new Date(date).toLocaleDateString()}`,
                icon: 'success',
                confirmButtonColor: '#16a34a',
                confirmButtonText: 'View My Bookings',
                showCancelButton: true,
                cancelButtonText: 'Close'
            }).then((result) => {
                if (result.isConfirmed) {
                    navigate("/my-bookings");
                }
            });

        } catch (err) {
            Swal.fire({
                title: 'Booking Failed',
                text: err.response?.data?.message || "Something went wrong. Please try again.",
                icon: 'error',
                confirmButtonColor: '#d33'
            });
        }
    };

    // Helper to translate price unit
    const getPriceUnitLabel = (unit) => {
        if (unit === 'hour') return t('rent.per_hr');
        if (unit === 'day') return t('rent.per_day');
        if (unit === 'acre') return t('rent.per_acre');
        return unit;
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* HEADER NAV */}
            <div className="bg-white p-4 shadow-sm sticky top-0 z-30">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition">
                        <ArrowLeft className="w-6 h-6 text-gray-800" />
                    </button>
                    {/* Translated Header */}
                    <h2 className="font-bold text-lg text-gray-800">{t('rent.machine_details')}</h2>
                </div>
            </div>

            {/* IMAGE SECTION */}
            <div className="max-w-4xl mx-auto px-4 mt-6">
                <div className="w-full h-64 md:h-96 bg-gray-200 rounded-3xl overflow-hidden shadow-md relative">
                    <img
                        src={machine.image}
                        alt={machine.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold shadow-sm uppercase text-green-800 tracking-wider">
                        {/* Dynamic Translation: 'machines.tractor', 'machines.rice_planter' */}
                        {t(`machines.${machine.type.toLowerCase().replace(" ", "_")}`, { defaultValue: machine.type })}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="max-w-4xl mx-auto px-4 mt-6 relative z-10">
                <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] border border-gray-100 p-6 md:p-8">

                    {/* Title & Price */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8 border-b border-gray-100 pb-6">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{machine.name}</h1>
                            <div className="flex items-center gap-2 text-gray-500 font-medium">
                                <MapPin className="w-5 h-5 text-green-600 fill-green-50" />
                                <span>{machine.user?.village || "Location not provided"}</span>
                            </div>
                        </div>
                        <div className="bg-green-50 px-6 py-4 rounded-2xl text-center min-w-[140px] shadow-sm border border-green-100">
                            <p className="text-3xl font-extrabold text-green-700">₹{machine.price}</p>
                            {/* Translated Price Unit */}
                            <p className="text-xs font-bold text-green-800/70 uppercase tracking-wider">
                                {getPriceUnitLabel(machine.priceUnit)}
                            </p>
                        </div>
                    </div>

                    {/* Owner Details */}
                    <div className="bg-gray-50/80 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-5 mb-8 border border-gray-200">
                        <div className="w-16 h-16 rounded-full bg-white border-2 border-white shadow-md overflow-hidden shrink-0 flex items-center justify-center">
                            {machine.user?.profileImage ? (
                                <img
                                    src={machine.user.profileImage}
                                    alt="Owner"
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                />
                            ) : null}
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400" style={{ display: machine.user?.profileImage ? 'none' : 'flex' }}>
                                <User className="w-8 h-8" />
                            </div>
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <p className="font-bold text-xl text-gray-800">{machine.user?.name || "Unknown Owner"}</p>
                            <div className="flex items-center justify-center md:justify-start gap-1 text-sm text-green-700 font-medium">
                                {/* Translated Verified */}
                                <CheckCircle2 className="w-4 h-4" /> {t('rent.verified')}
                            </div>
                        </div>
                        {!isOwner && machine.user?.phone && (
                            <div className="flex flex-col items-center md:items-end gap-2">
                                <a href={`tel:${machine.user.phone}`} className="flex items-center gap-2 bg-white hover:bg-green-50 text-green-700 border border-green-200 px-5 py-2.5 rounded-xl font-bold transition text-sm shadow-sm">
                                    {/* Translated Call */}
                                    <Phone className="w-4 h-4" /> {t('rent.call')} {machine.user.phone}
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Booking Form */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-lg">
                                <ClipboardList className="w-5 h-5 text-green-600" /> {t('rent.desc')}
                            </h3>
                            <p className="text-gray-600 bg-gray-50 p-5 rounded-2xl text-sm leading-relaxed border border-gray-100">
                                {machine.description || "No description provided for this machine."}
                            </p>
                        </div>

                        <div className="border-t border-gray-100 pt-8">
                            <h3 className="font-bold text-gray-900 mb-6 text-xl flex items-center gap-2">
                                <CalendarCheck className="w-6 h-6 text-green-600" />
                                {isOwner ? t('rent.booking_status') : t('rent.book')}
                            </h3>

                            <form onSubmit={handleBook} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-1">
                                    {/* Translated Label */}
                                    <label className="text-xs font-bold text-gray-700 uppercase ml-1 mb-2 block">{t('rent.select_date')}</label>
                                    <input
                                        type="date"
                                        required={!isOwner}
                                        disabled={isOwner}
                                        min={new Date().toISOString().split("T")[0]}
                                        className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-white transition-all font-medium text-gray-700 shadow-sm"
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    {/* Translated Label */}
                                    <label className="text-xs font-bold text-gray-700 uppercase ml-1 mb-2 block">{t('rent.req')}</label>
                                    <textarea
                                        rows="3"
                                        disabled={isOwner}
                                        placeholder={isOwner ? "You cannot book your own machine." : "E.g., Need driver, specific time, acreage..."}
                                        className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-white transition-all resize-none text-gray-700 shadow-sm"
                                        onChange={(e) => setNotes(e.target.value)}
                                    ></textarea>
                                </div>

                                {/* --- UPDATED BUTTON STYLING --- */}
                                <div className="md:col-span-2 mt-4">
                                    <button
                                        type="submit"
                                        disabled={isOwner}
                                        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 ${isOwner
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                            : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-green-200/50 hover:-translate-y-1 active:translate-y-0'
                                            }`}
                                    >
                                        {isOwner ? (
                                            <>{t('rent.your_machine')}</>
                                        ) : (
                                            <>{t('rent.send')} <CalendarCheck className="w-6 h-6" /></>
                                        )}
                                    </button>
                                    {isOwner && (
                                        <p className="text-center text-xs text-gray-400 mt-2">
                                            To manage bookings, go to "My Machines".
                                        </p>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RentDetails;