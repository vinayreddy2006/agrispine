import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, CheckCircle2, AlertCircle, XCircle, User, MapPin, 
  Sparkles, Check, X, Phone, Tractor, ArrowLeft, ArrowRight, 
  Layers, MessageSquare 
} from "lucide-react";

const BookingCalendar = ({ bookings = [], role = "renter", onStatusUpdate, onStartChat }) => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(
    new Date().toISOString().split("T")[0]
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Total days in current month
  const totalDays = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateKey(today.toISOString().split("T")[0]);
  };

  // Group bookings by YYYY-MM-DD
  const bookingsByDate = {};
  bookings.forEach(b => {
    if (!b.date) return;
    const dStr = new Date(b.date).toISOString().split("T")[0];
    if (!bookingsByDate[dStr]) bookingsByDate[dStr] = [];
    bookingsByDate[dStr].push(b);
  });

  const selectedDayBookings = bookingsByDate[selectedDateKey] || [];

  const getStatusConfig = (status) => {
    switch (status) {
      case "accepted":
      case "confirmed":
        return { 
          label: t('calendar.confirmed', 'Confirmed'), 
          pillBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
          badgeBg: "bg-emerald-600 text-white",
          dotBg: "bg-emerald-500",
          border: "border-emerald-300"
        };
      case "completed":
        return { 
          label: t('calendar.completed', 'Completed'), 
          pillBg: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800",
          badgeBg: "bg-blue-600 text-white",
          dotBg: "bg-blue-500",
          border: "border-blue-300"
        };
      case "rejected":
        return { 
          label: t('calendar.rejected', 'Rejected'), 
          pillBg: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800",
          badgeBg: "bg-rose-600 text-white",
          dotBg: "bg-rose-500",
          border: "border-rose-300"
        };
      case "cancelled":
        return { 
          label: t('calendar.cancelled', 'Cancelled'), 
          pillBg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700",
          badgeBg: "bg-slate-500 text-white",
          dotBg: "bg-slate-400",
          border: "border-slate-300"
        };
      default:
        return { 
          label: t('calendar.pending', 'Pending'), 
          pillBg: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800",
          badgeBg: "bg-amber-500 text-white",
          dotBg: "bg-amber-400",
          border: "border-amber-300"
        };
    }
  };

  const selectedDateFormatted = new Date(selectedDateKey + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
      
      {/* ============================================================== */}
      {/* 1. COMPACT MONTH / YEAR HEADER & VISUALLY STRONGER CONTROLS   */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        
        {/* Month & Year Title */}
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 shrink-0">
            <CalendarIcon className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {t('months.' + monthNames[month].toLowerCase(), monthNames[month])} {year}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {role === "owner" 
                ? t('calendar.equipment_schedule', "Equipment schedule & incoming bookings") 
                : t('calendar.personal_schedule', "Your personal machinery bookings schedule")}
            </p>
          </div>
        </div>

        {/* Visually Strong Navigation Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Previous Month */}
          <button
            type="button"
            onClick={handlePrevMonth}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
            title={t('calendar.prev_month', 'Previous Month')}
          >
            <ArrowLeft className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[2.5]" />
            <span>{t('calendar.previous', 'Previous')}</span>
          </button>

          {/* Today Button */}
          <button
            type="button"
            onClick={handleGoToday}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-sm flex items-center justify-center gap-1.5 border border-emerald-600 active:scale-95"
            title={t('calendar.jump_today', 'Jump to Today')}
          >
            <CalendarIcon className="w-4 h-4 stroke-[2.5]" />
            <span>{t('calendar.today', 'Today')}</span>
          </button>

          {/* Next Month */}
          <button
            type="button"
            onClick={handleNextMonth}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
            title={t('calendar.next_month', 'Next Month')}
          >
            <span>{t('calendar.next', 'Next')}</span>
            <ArrowRight className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-1">
        <span>{t('calendar.sun', 'Sun')}</span>
        <span>{t('calendar.mon', 'Mon')}</span>
        <span>{t('calendar.tue', 'Tue')}</span>
        <span>{t('calendar.wed', 'Wed')}</span>
        <span>{t('calendar.thu', 'Thu')}</span>
        <span>{t('calendar.fri', 'Fri')}</span>
        <span>{t('calendar.sat', 'Sat')}</span>
      </div>

      {/* ============================================================== */}
      {/* 2. COMPACT CALENDAR DAYS GRID (BALANCED PROPORTIONS)          */}
      {/* ============================================================== */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {/* Leading empty cells for alignment */}
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div 
            key={`empty-${i}`} 
            className="h-13 sm:h-16 min-h-[52px] sm:min-h-[60px] rounded-xl bg-slate-50/40 dark:bg-slate-900/20 border border-transparent opacity-20 pointer-events-none"
          ></div>
        ))}

        {/* Days of Month */}
        {Array.from({ length: totalDays }).map((_, i) => {
          const dayNum = i + 1;
          const monthStr = String(month + 1).padStart(2, "0");
          const dayStr = String(dayNum).padStart(2, "0");
          const dateKey = `${year}-${monthStr}-${dayStr}`;

          const dayBookings = bookingsByDate[dateKey] || [];
          const isSelected = selectedDateKey === dateKey;
          const isToday = new Date().toISOString().split("T")[0] === dateKey;

          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDateKey(dateKey)}
              className={`h-13 sm:h-16 min-h-[52px] sm:min-h-[60px] p-1 sm:p-1.5 rounded-xl border transition-all flex flex-col justify-between items-start text-left relative overflow-hidden group ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/60 ring-2 ring-emerald-500/30 shadow-xs'
                  : isToday
                  ? 'border-emerald-400 dark:border-emerald-500 bg-white dark:bg-slate-850 shadow-xs'
                  : dayBookings.length > 0
                  ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:border-emerald-300'
                  : 'border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-850 hover:bg-slate-50'
              }`}
            >
              {/* Day Number and Count Pill */}
              <div className="flex items-center justify-between w-full">
                <span className={`text-[11px] sm:text-xs font-black rounded-md px-1.5 py-0.2 ${
                  isSelected 
                    ? 'bg-emerald-600 text-white' 
                    : isToday 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                    : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {dayNum}
                </span>

                {dayBookings.length > 0 && (
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60">
                    {dayBookings.length}
                  </span>
                )}
              </div>

              {/* Event bars inside the calendar cell */}
              <div className="w-full space-y-0.5 overflow-hidden">
                {dayBookings.slice(0, 1).map((b) => {
                  const cfg = getStatusConfig(b.status);
                  const displayTitle = b.machine?.name || "Equipment";
                  return (
                    <div 
                      key={b._id}
                      className={`w-full px-1 py-0.5 rounded text-[9px] sm:text-[10px] font-bold truncate border flex items-center gap-1 ${cfg.pillBg}`}
                      title={`${displayTitle} - ${cfg.label}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotBg} shrink-0`}></span>
                      <span className="truncate">{displayTitle}</span>
                    </div>
                  );
                })}

                {dayBookings.length > 1 && (
                  <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 block px-0.5 leading-tight">
                    +{dayBookings.length - 1} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* 3. SELECTED DAY SCHEDULE DETAILS PANEL                          */}
      {/* ============================================================== */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              {t('calendar.schedule_details', 'Schedule Details')}
            </span>
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-emerald-600" />
              <span>{selectedDateFormatted}</span>
            </h4>
          </div>

          <span className="px-3 py-1 rounded-xl bg-white dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-600">
            {selectedDayBookings.length} {selectedDayBookings.length === 1 ? t('calendar.booking_scheduled', 'Booking Scheduled') : t('calendar.bookings_scheduled', 'Bookings Scheduled')}
          </span>
        </div>

        {selectedDayBookings.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 font-medium">
            {t('calendar.no_bookings_date', 'No machinery bookings scheduled for this date.')}
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDayBookings.map((b) => {
              const cfg = getStatusConfig(b.status);
              const otherParty = role === "owner" ? b.farmer : b.provider;

              return (
                <div
                  key={b._id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition hover:shadow-xs"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <img
                      src={b.machine?.image || "/machines/tractor.png"}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                          {b.machine?.name}
                        </span>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase ${cfg.pillBg}`}>
                          {cfg.label}
                        </span>
                      </div>
                      
                      {/* Operation and Rate */}
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mt-1 flex-wrap font-medium">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/50">
                          {b.task?.name || "General Operation"}
                        </span>
                        <span>•</span>
                        <span>{t('calendar.duration', 'Duration')}: {b.duration || 1} {b.task?.priceUnit || t('calendar.hours', 'hr')}</span>
                        {b.totalAmount && (
                          <>
                            <span>•</span>
                            <span className="font-black text-slate-900 dark:text-white">{t('calendar.total', 'Total')}: ₹{b.totalAmount}</span>
                          </>
                        )}
                      </div>

                      {/* Contact / Location */}
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {role === "owner" ? `${t('calendar.renter_label', 'Renter')}: ` : `${t('calendar.owner_label', 'Equipment Owner')}: `}
                          <strong className="text-slate-700 dark:text-slate-300">{otherParty?.name || t('common.farmer', 'Farmer')}</strong>
                        </span>
                        {otherParty?.village && (
                          <span>({otherParty.village}, {otherParty.district || ""})</span>
                        )}
                      </div>

                      {b.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700 mt-2 italic">
                          "{b.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800 flex-wrap">
                    
                    {/* Owner specific workflow actions */}
                    {role === "owner" && onStatusUpdate && (
                      <>
                        {b.status === "pending" && (
                          <>
                            <button
                              onClick={() => onStatusUpdate(b._id, "accepted")}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                            >
                              <Check className="w-4 h-4 stroke-[2.5]" />
                              <span>{t('calendar.accept_request', 'Accept Request')}</span>
                            </button>
                            <button
                              onClick={() => onStatusUpdate(b._id, "rejected")}
                              className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
                            >
                              <X className="w-4 h-4 stroke-[2.5]" />
                              <span>{t('calendar.reject_request', 'Reject')}</span>
                            </button>
                          </>
                        )}

                        {(b.status === "accepted" || b.status === "confirmed") && (
                          <button
                            onClick={() => onStatusUpdate(b._id, "completed")}
                            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                          >
                            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                            <span>{t('calendar.mark_completed', 'Mark Completed')}</span>
                          </button>
                        )}
                      </>
                    )}

                    {/* Chat button */}
                    {otherParty?._id && onStartChat && (
                      <button
                        onClick={() => onStartChat(otherParty._id)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-emerald-600 hover:bg-white text-xs font-bold transition"
                        title="Message"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                      </button>
                    )}

                    {/* Phone Call */}
                    {otherParty?.phone && (
                      <a
                        href={`tel:${otherParty.phone}`}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-600 hover:bg-white text-xs font-bold transition flex items-center gap-1.5"
                        title="Call"
                      >
                        <Phone className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold">{otherParty.phone}</span>
                      </a>
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

export default BookingCalendar;
