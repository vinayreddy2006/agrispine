import React, { useState } from "react";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, CheckCircle2, AlertCircle, XCircle, User, MapPin, 
  Sparkles, Check, X, Phone 
} from "lucide-react";

const BookingCalendar = ({ bookings = [], role = "renter", onStatusUpdate }) => {
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

  // Map bookings to YYYY-MM-DD
  const bookingsByDate = {};
  bookings.forEach(b => {
    if (!b.date) return;
    const dStr = new Date(b.date).toISOString().split("T")[0];
    if (!bookingsByDate[dStr]) bookingsByDate[dStr] = [];
    bookingsByDate[dStr].push(b);
  });

  const selectedDayBookings = bookingsByDate[selectedDateKey] || [];

  const getStatusBadge = (status) => {
    switch (status) {
      case "accepted":
      case "confirmed":
        return { label: "Confirmed", bg: "bg-emerald-500", text: "text-emerald-700 bg-emerald-50 border-emerald-200" };
      case "completed":
        return { label: "Completed", bg: "bg-blue-500", text: "text-blue-700 bg-blue-50 border-blue-200" };
      case "rejected":
        return { label: "Rejected", bg: "bg-rose-500", text: "text-rose-700 bg-rose-50 border-rose-200" };
      case "cancelled":
        return { label: "Cancelled", bg: "bg-slate-400", text: "text-slate-600 bg-slate-100 border-slate-200" };
      default:
        return { label: "Pending", bg: "bg-amber-400", text: "text-amber-700 bg-amber-50 border-amber-200" };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
      
      {/* Calendar Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            {monthNames[month]} {year}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const now = new Date();
              setCurrentDate(now);
              setSelectedDateKey(now.toISOString().split("T")[0]);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Leading empty cells */}
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="h-14 sm:h-16 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 opacity-40"></div>
        ))}

        {/* Days of month */}
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
              className={`h-14 sm:h-16 p-1.5 rounded-2xl border transition flex flex-col justify-between items-start text-left relative overflow-hidden group ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                  : isToday
                  ? 'border-emerald-300 bg-white dark:bg-slate-800'
                  : 'border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs font-bold rounded-lg px-1.5 py-0.5 ${
                  isSelected 
                    ? 'bg-emerald-600 text-white' 
                    : isToday 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                    : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {dayNum}
                </span>

                {dayBookings.length > 0 && (
                  <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1 rounded-md">
                    {dayBookings.length}
                  </span>
                )}
              </div>

              {/* Status indicators */}
              <div className="flex items-center gap-1 w-full overflow-hidden">
                {dayBookings.slice(0, 3).map((b, idx) => {
                  const badge = getStatusBadge(b.status);
                  return (
                    <span 
                      key={idx} 
                      className={`w-2 h-2 rounded-full ${badge.bg}`}
                      title={`${b.machine?.name || "Booking"}: ${badge.label}`}
                    ></span>
                  );
                })}
                {dayBookings.length > 3 && (
                  <span className="text-[9px] text-slate-400 leading-none">+{dayBookings.length - 3}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Schedule View */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Schedule for {new Date(selectedDateKey + "T00:00:00").toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </h4>
          <span className="text-xs text-slate-400">
            {selectedDayBookings.length} {selectedDayBookings.length === 1 ? 'Booking' : 'Bookings'}
          </span>
        </div>

        {selectedDayBookings.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-850 text-xs text-slate-400">
            No bookings scheduled for this date.
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDayBookings.map((b) => {
              const badge = getStatusBadge(b.status);
              const otherParty = role === "owner" ? b.farmer : b.provider;
              return (
                <div
                  key={b._id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={b.machine?.image || "/machines/tractor.png"}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover bg-white border border-slate-200 flex-shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {b.machine?.name}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${badge.text}`}>
                          {badge.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold text-emerald-600">
                          {b.task?.name || "General Operation"}
                        </span>
                        <span>•</span>
                        <span>{b.duration || 1} {b.task?.priceUnit || 'hr'}s</span>
                        {b.totalAmount && (
                          <>
                            <span>•</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">₹{b.totalAmount}</span>
                          </>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{role === "owner" ? "Renter: " : "Owner: "} {otherParty?.name || "User"}</span>
                        {otherParty?.village && <span>({otherParty.village})</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions for owner */}
                  {role === "owner" && (b.status === "pending" || b.status === "accepted") && onStatusUpdate && (
                    <div className="flex items-center gap-2 self-end md:self-center">
                      {b.status === "pending" && (
                        <>
                          <button
                            onClick={() => onStatusUpdate(b._id, "accepted")}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => onStatusUpdate(b._id, "rejected")}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                      {b.status === "accepted" && (
                        <button
                          onClick={() => onStatusUpdate(b._id, "completed")}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Completed</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Contact button */}
                  {otherParty?.phone && (
                    <a
                      href={`tel:${otherParty.phone}`}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-emerald-600 hover:bg-white text-xs font-bold flex items-center gap-1 self-end md:self-center transition"
                      title="Call"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}

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

