import React, { useState } from "react";
import { Star, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import api from "../../../utils/api";
import Swal from "sweetalert2";

const ReviewModal = ({ isOpen, onClose, booking, onReviewSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setErrorMsg("Please select a rating between 1 and 5 stars");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const token = localStorage.getItem("token");
      const { data } = await api.post("/reviews/add", {
        bookingId: booking._id,
        rating,
        comment
      }, { headers: { "auth-token": token } });

      if (data.success) {
        await Swal.fire({
          title: "Review Submitted! ⭐",
          text: "Thank you for supporting our agricultural community with your verified rating.",
          icon: "success",
          confirmButtonColor: "#16a34a"
        });

        if (onReviewSubmitted) {
          onReviewSubmitted(booking._id);
        }
        onClose();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Could not submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-600 to-green-700 px-6 py-5 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold">Rate Your Experience</h3>
          <p className="text-xs text-emerald-100">Verified rental review for {booking.machine?.name}</p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Machine preview */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <img
              src={booking.machine?.image || "/machines/tractor.png"}
              alt=""
              className="w-12 h-12 rounded-xl object-cover bg-white"
            />
            <div>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100 block">
                {booking.machine?.name}
              </span>
              <span className="text-xs text-slate-500">
                Service: {booking.task?.name || "General Work"}
              </span>
            </div>
          </div>

          {/* Interactive Star Rating */}
          <div className="text-center py-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              How would you rate the equipment & operator?
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-amber-600 block mt-2">
              {rating === 5 ? "Excellent ⭐⭐⭐⭐⭐" : rating === 4 ? "Very Good ⭐⭐⭐⭐" : rating === 3 ? "Good ⭐⭐⭐" : rating === 2 ? "Fair ⭐⭐" : "Poor ⭐"}
            </span>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Your Review & Comments (Optional)
            </label>
            <textarea
              rows="3"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the machine's condition, performance, punctuality, and operator behavior?"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            ></textarea>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Submit Verified Review</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ReviewModal;

