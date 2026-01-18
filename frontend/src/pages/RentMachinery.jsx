import { useEffect, useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Tractor, Phone, ArrowLeft, PlusCircle, User, Search, Filter, X, Trash2, Calendar, ClipboardList, ArrowRight
} from "lucide-react";

const RentMachinery = () => {
  const navigate = useNavigate();
  const [machines, setMachines] = useState([]);
  const [filteredMachines, setFilteredMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // --- Search & Filter States ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");

  // --- Booking Modal State ---
  const [bookingModal, setBookingModal] = useState(null); // Stores the machine object being booked
  const [bookingData, setBookingData] = useState({ date: "", notes: "" });

  // 1. Fetch Data & User
  useEffect(() => {
    const initialize = async () => {
      try {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        if (userStr) setCurrentUser(JSON.parse(userStr));

        const { data } = await api.get("/machines/fetchall", {
          headers: { "auth-token": token }
        });
        setMachines(data);
        setFilteredMachines(data);
      } catch (err) {
        console.error("Failed to fetch machines", err);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  // 2. Filter Logic
  useEffect(() => {
    let result = machines;

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(lowerTerm) ||
        m.description?.toLowerCase().includes(lowerTerm) ||
        m.type.toLowerCase().includes(lowerTerm)
      );
    }

    if (selectedType !== "All") {
      result = result.filter(m => m.type === selectedType);
    }

    if (maxPrice) {
      result = result.filter(m => m.price <= parseInt(maxPrice));
    }

    setFilteredMachines(result);
  }, [searchTerm, selectedType, maxPrice, machines]);

  // 3. Handle Delete
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Remove Machine?',
      text: "You won't be able to undo this.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        await api.delete(`/machines/delete/${id}`, {
          headers: { "auth-token": token }
        });
        setMachines(machines.filter(m => m._id !== id));
        Swal.fire('Deleted!', 'Machine removed.', 'success');
      } catch (err) {
        Swal.fire('Error', 'Could not delete machine.', 'error');
      }
    }
  };

  // 4. Handle Booking Submit
  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!bookingData.date) return Swal.fire("Error", "Please select a date", "warning");

    try {
      const token = localStorage.getItem("token");
      await api.post("/bookings/book", {
        machineId: bookingModal._id,
        date: bookingData.date,
        notes: bookingData.notes
      }, { headers: { "auth-token": token } });

      Swal.fire("Request Sent!", "The owner will review your booking.", "success");
      setBookingModal(null);
      setBookingData({ date: "", notes: "" });
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Booking Failed", "error");
    }
  };

  return (
    <div className="w-full">

      {/* --- HEADER --- */}
      <div className="bg-white shadow-sm sticky top-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Tractor className="text-green-600" /> Machinery
            </h1>
          </div>

          <div className="flex gap-2">
            {/* New "My Bookings" Button */}
            <button
              onClick={() => navigate("/my-bookings")}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition font-medium text-sm"
            >
              <ClipboardList className="w-4 h-4" /> <span className="hidden md:inline">My Bookings</span>
            </button>

            <button
              onClick={() => navigate("/add-machine")}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition font-medium text-sm"
            >
              <PlusCircle className="w-4 h-4" /> List Machine
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="max-w-6xl mx-auto mt-4 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              placeholder="Search tractors, harvesters..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <select
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white text-gray-700"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Tractor">Tractor 🚜</option>
              <option value="Harvester">Harvester 🌾</option>
              <option value="Drone">Drone 🚁</option>
              <option value="Rotavator">Rotavator ⚙️</option>
              <option value="JCB">JCB / Excavator 🏗️</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500 text-sm font-bold">₹</span>
              <input
                type="number"
                placeholder="Max Price"
                className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
          <div className="md:col-span-1">
            {(searchTerm || selectedType !== "All" || maxPrice) && (
              <button
                onClick={() => { setSearchTerm(""); setSelectedType("All"); setMaxPrice(""); }}
                className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 hover:text-red-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="max-w-6xl mx-auto p-6">
        {loading ? (
          <p className="text-center text-gray-500 mt-10">Loading available machines...</p>
        ) : filteredMachines.length === 0 ? (
          <div className="text-center bg-white p-16 rounded-xl shadow-sm border border-gray-200">
            <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No Machines Found</h3>
            <button
              onClick={() => { setSearchTerm(""); setSelectedType("All"); setMaxPrice(""); }}
              className="text-green-600 font-bold hover:underline"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMachines.map((machine) => {
              // Check Ownership
              const isOwner = currentUser && (
                (machine.user?._id && String(machine.user._id) === String(currentUser._id || currentUser.id)) ||
                (machine.user && String(machine.user) === String(currentUser._id || currentUser.id))
              );

              return (
                <div key={machine._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group relative flex flex-col">

                  <div className="h-48 bg-gray-100 relative overflow-hidden">
                    <img
                      src={machine.image || "https://cdn-icons-png.flaticon.com/512/2318/2318736.png"}
                      alt={machine.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{machine.type}</span>
                    </div>

                    {isOwner && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(machine._id);
                        }}
                        className="absolute top-3 left-3 bg-white text-gray-500 p-2 rounded-full hover:bg-red-50 hover:text-red-600 transition shadow-md z-10 border border-gray-200"
                        title="Delete this machine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{machine.name}</h3>
                      {isOwner && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">YOU</span>}
                    </div>

                    <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[40px]">{machine.description}</p>

                    <div className="mt-auto">
                      <div className="flex justify-between items-end border-t pt-4 border-gray-100 mb-4">
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Price</p>
                          <p className="font-bold text-green-700 text-lg">₹{machine.price} <span className="text-xs font-medium text-gray-400">/ {machine.priceUnit}</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400 mb-1">Owner</p>
                          <div className="flex items-center gap-1.5 text-gray-700 text-sm font-medium">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            {machine.user?.name || "Farmer"}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {/* Call Button */}
                        <a
                          href={`tel:${machine.user?.phone}`}
                          className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition"
                        >
                          <Phone className="w-4 h-4" /> <span className="text-sm">Call</span>
                        </a>

                        {/* Book Button (Disabled if Owner) */}
                        <button
                          disabled={isOwner}
                          onClick={() => setBookingModal(machine)}
                          className={`flex-[2] text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition shadow-sm active:scale-95
                                    ${isOwner ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                          <Calendar className="w-4 h-4" /> Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- BOOKING MODAL --- */}
      {bookingModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm animate-in zoom-in duration-200 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-green-600 p-6 text-white relative">
              <button onClick={() => setBookingModal(null)} className="absolute top-4 right-4 p-1 bg-white/20 rounded-full hover:bg-white/30 transition">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold">Book Machine</h3>
              <p className="text-green-100 text-sm mt-1">{bookingModal.name}</p>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleBookSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium text-gray-700"
                  onChange={e => setBookingData({ ...bookingData, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Need for 3 acres, morning time..."
                  className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
                />
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-bold shadow-md transition flex items-center justify-center gap-2">
                  Confirm Request <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default RentMachinery;