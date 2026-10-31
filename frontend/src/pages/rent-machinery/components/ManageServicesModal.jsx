import React, { useState, useEffect } from "react";
import api from "../../../utils/api";
import Swal from "sweetalert2";
import { 
  X, Plus, Edit2, Trash2, Check, AlertCircle, Wrench, 
  IndianRupee, Layers, CheckCircle2, Clock, Calendar, 
  Sparkles, Power, ArrowRight, Info
} from "lucide-react";

const ManageServicesModal = ({ isOpen, onClose, machine, onServicesUpdated }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Add New Service Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newUnit, setNewUnit] = useState("hour");
  const [newDescription, setNewDescription] = useState("");

  // Edit Existing Service State
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editUnit, setEditUnit] = useState("hour");
  const [editDescription, setEditDescription] = useState("");

  const fetchServices = async () => {
    if (!machine?._id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.get(`/machines/${machine._id}/services`, {
        headers: { "auth-token": token }
      });
      setServices(Array.isArray(data.tasks) ? data.tasks : Array.isArray(machine.tasks) ? machine.tasks : []);
    } catch (err) {
      // Fallback to machine.tasks prop
      setServices(Array.isArray(machine.tasks) ? machine.tasks : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && machine) {
      fetchServices();
      setShowAddForm(false);
      setEditingServiceId(null);
    }
  }, [isOpen, machine]);

  if (!isOpen || !machine) return null;

  // 1. ADD NEW SERVICE
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

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.post(`/machines/${machine._id}/services`, {
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

      if (onServicesUpdated) onServicesUpdated(data.tasks);

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
      setSubmitting(false);
    }
  };

  // 2. START EDITING SERVICE
  const startEditing = (srv) => {
    setEditingServiceId(srv._id);
    setEditName(srv.name);
    setEditPrice(srv.price);
    setEditUnit(srv.priceUnit || "hour");
    setEditDescription(srv.description || "");
  };

  // 3. SAVE EDITED SERVICE
  const handleSaveEdit = async (serviceId) => {
    if (!editName.trim()) {
      Swal.fire("Validation Error", "Service name cannot be empty", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.put(`/machines/${machine._id}/services/${serviceId}`, {
        name: editName.trim(),
        price: Number(editPrice),
        priceUnit: editUnit,
        description: editDescription.trim()
      }, { headers: { "auth-token": token } });

      setServices(data.tasks);
      setEditingServiceId(null);

      if (onServicesUpdated) onServicesUpdated(data.tasks);

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
    } finally {
      setSubmitting(false);
    }
  };

  // 4. TOGGLE SERVICE AVAILABILITY (ENABLE / DISABLE)
  const handleToggleService = async (serviceId, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      const token = localStorage.getItem("token");
      // Optimistic update
      setServices(prev => prev.map(s => s._id === serviceId ? { ...s, available: newStatus } : s));

      const { data } = await api.put(`/machines/${machine._id}/services/${serviceId}`, {
        available: newStatus
      }, { headers: { "auth-token": token } });

      if (data.tasks) setServices(data.tasks);
      if (onServicesUpdated) onServicesUpdated(data.tasks);

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

  // 5. REMOVE SERVICE (WITH SAFETY CHECKS FOR PENDING AND CONFIRMED BOOKINGS)
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
      const res = await api.delete(`/machines/${machine._id}/services/${serviceId}`, {
        headers: { "auth-token": token },
        data: { forceCancelConfirmed: false }
      });

      // If confirmed bookings exist, backend returns requiresConfirmation
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
            Removing this service will <strong>cancel these confirmed bookings</strong> and notify the farmers via the system. Historical completed bookings will remain unchanged.
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
          const finalRes = await api.delete(`/machines/${machine._id}/services/${serviceId}`, {
            headers: { "auth-token": token },
            data: { forceCancelConfirmed: true }
          });

          setServices(finalRes.data.tasks);
          if (onServicesUpdated) onServicesUpdated(finalRes.data.tasks);

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

      // No confirmed bookings, successfully deleted
      setServices(res.data.tasks);
      if (onServicesUpdated) onServicesUpdated(res.data.tasks);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                Manage Services: {machine.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure agricultural tasks, individual rates, and availability
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Note Banner on Pricing */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Transparent Pricing:</strong> Updating a service's rate will apply only to future bookings. All existing pending requests and confirmed bookings safely retain their originally agreed prices.
            </p>
          </div>

          {/* Add Service Toggle Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-700/80 hover:border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition hover:shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add New Agricultural Service</span>
            </button>
          )}

          {/* Add Service Inline Form */}
          {showAddForm && (
            <form onSubmit={handleAddService} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3.5 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                  New Agricultural Service
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Service / Task Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Deep Ploughing, Rotavator, Spraying"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Rate (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g., 900"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="w-28">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Unit
                    </label>
                    <select
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="hour">per hour</option>
                      <option value="acre">per acre</option>
                      <option value="day">per day</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Optional Description
                </label>
                <input
                  type="text"
                  placeholder="e.g., Includes skilled operator and standard fuel charges"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{submitting ? "Saving..." : "Save Service"}</span>
                </button>
              </div>
            </form>
          )}

          {/* Current Services List */}
          <div className="space-y-3">
            <span className="text-[11px] font-black uppercase text-slate-400 block tracking-wider">
              Currently Configured Services ({services.length})
            </span>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading services...</div>
            ) : services.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No individual agricultural services configured yet. Click above to add your first service.
              </div>
            ) : (
              services.map((srv) => {
                const isEditing = editingServiceId === srv._id;
                const isAvailable = srv.available !== false;

                if (isEditing) {
                  return (
                    <div key={srv._id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-emerald-500 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 block mb-1">Service Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="text-[11px] font-bold text-slate-500 block mb-1">Rate (₹)</label>
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                            />
                          </div>
                          <div className="w-28">
                            <label className="text-[11px] font-bold text-slate-500 block mb-1">Unit</label>
                            <select
                              value={editUnit}
                              onChange={(e) => setEditUnit(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                            >
                              <option value="hour">per hour</option>
                              <option value="acre">per acre</option>
                              <option value="day">per day</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1">Description</label>
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingServiceId(null)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleSaveEdit(srv._id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={srv._id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-300 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          {srv.name}
                        </span>
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-200/50">
                          ₹{srv.price} / {srv.priceUnit || 'hour'}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
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

                      {/* Active bookings badge if any */}
                      {(srv.pendingBookingsCount > 0 || srv.confirmedBookingsCount > 0) && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-0.5">
                          {srv.pendingBookingsCount > 0 && (
                            <span className="text-amber-600 font-bold">
                              {srv.pendingBookingsCount} pending request(s)
                            </span>
                          )}
                          {srv.confirmedBookingsCount > 0 && (
                            <span className="text-blue-600 font-bold">
                              {srv.confirmedBookingsCount} confirmed upcoming job(s)
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 w-full sm:w-auto justify-end">
                      {/* Enable/Disable Toggle */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isAvailable}
                        onClick={() => handleToggleService(srv._id, isAvailable)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition"
                        title={isAvailable ? "Click to disable this service" : "Click to enable this service"}
                      >
                        <div className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                          isAvailable ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                        }`}>
                          <div className={`w-3 h-3 rounded-full bg-white shadow-xs transform transition-transform duration-200 ${
                            isAvailable ? 'translate-x-3' : 'translate-x-0'
                          }`} />
                        </div>
                        <span className="text-[11px]">{isAvailable ? 'On' : 'Off'}</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => startEditing(srv)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition"
                        title="Edit Service"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteService(srv._id, srv.name)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Remove Service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs sm:text-sm font-bold shadow-xs transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

export default ManageServicesModal;

