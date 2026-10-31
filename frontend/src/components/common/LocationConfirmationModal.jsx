import React, { useState, useEffect, useRef } from "react";
import { 
  MapPin, Search, Navigation, CheckCircle2, AlertCircle, 
  X, Loader2, Sparkles, Building, ChevronRight 
} from "lucide-react";
import api from "../../utils/api";

const LocationConfirmationModal = ({ isOpen, onClose, onLocationConfirmed, initialData = null }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    village: "",
    mandal: "",
    district: "",
    state: "",
    placeId: "",
    formattedAddress: "",
    coordinates: null
  });

  const searchTimerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const storedUser = localStorage.getItem("user");
      let u = initialData;
      if (!u && storedUser) {
        try {
          u = JSON.parse(storedUser);
        } catch (e) {
          console.error(e);
        }
      }
      if (u) {
        setForm({
          village: u.village || "",
          mandal: u.mandal || "",
          district: u.district || "",
          state: u.state || "Telangana",
          placeId: u.placeId || "",
          formattedAddress: u.formattedAddress || "",
          coordinates: u.locationCoordinates || null
        });
        if (u.village) {
          setQuery(u.village + (u.district ? `, ${u.district}` : ""));
        }
      }
    }
  }, [isOpen, initialData]);

  // Debounced search using OpenStreetMap Nominatim
  const handleQueryChange = (text) => {
    setQuery(text);
    setErrorMsg("");

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!text || text.trim().length < 2) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&limit=6&q=${encodeURIComponent(text.trim())}`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Geocoding lookup error:", err);
      } finally {
        setSearching(false);
      }
    }, 450);
  };

  const handleSelectSuggestion = (item) => {
    const addr = item.address || {};
    const village = addr.village || addr.suburb || addr.neighbourhood || addr.hamlet || addr.town || addr.city || item.name || "";
    const mandal = addr.county || addr.subdistrict || addr.taluk || "";
    const district = addr.state_district || addr.district || addr.county || "";
    const state = addr.state || "";
    
    setForm({
      village,
      mandal,
      district,
      state,
      placeId: String(item.place_id || ""),
      formattedAddress: item.display_name || "",
      coordinates: {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }
    });

    setQuery(village ? `${village}, ${district || state}` : item.display_name);
    setSuggestions([]);
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      return;
    }

    setDetectingGps(true);
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${latitude}&lon=${longitude}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const village = addr.village || addr.suburb || addr.neighbourhood || addr.hamlet || addr.town || addr.city || "";
            const mandal = addr.county || addr.subdistrict || addr.taluk || "";
            const district = addr.state_district || addr.district || "";
            const state = addr.state || "";

            setForm({
              village,
              mandal,
              district,
              state,
              placeId: String(data.place_id || ""),
              formattedAddress: data.display_name || "",
              coordinates: { lat: latitude, lng: longitude }
            });
            setQuery(village ? `${village}, ${district || state}` : data.display_name);
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          setErrorMsg("Could not resolve location name from GPS");
        } finally {
          setDetectingGps(false);
        }
      },
      (err) => {
        setDetectingGps(false);
        setErrorMsg("GPS permission denied or unavailable");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.village.trim() && !form.district.trim()) {
      setErrorMsg("Please specify at least your Village/Town and District");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    try {
      const payload = {
        village: form.village.trim(),
        mandal: form.mandal.trim(),
        district: form.district.trim(),
        state: form.state.trim() || "Telangana",
        coordinates: form.coordinates,
        placeId: form.placeId,
        formattedAddress: form.formattedAddress || `${form.village}, ${form.mandal}, ${form.district}, ${form.state}`
      };

      const { data } = await api.put("/auth/confirm-location", payload);

      if (data.success && data.user) {
        // Update stored user
        const stored = localStorage.getItem("user");
        let u = {};
        if (stored) {
          try { u = JSON.parse(stored); } catch (e) {}
        }
        const updated = { ...u, ...data.user, isLocationConfirmed: true };
        localStorage.setItem("user", JSON.stringify(updated));

        // Dispatch window event so components can update in real-time
        window.dispatchEvent(new CustomEvent("agrispine_location_confirmed", { detail: updated }));

        if (onLocationConfirmed) {
          onLocationConfirmed(updated);
        }
        onClose();
      }
    } catch (err) {
      console.error("Failed to save location:", err);
      setErrorMsg(err.response?.data?.message || "Failed to confirm location. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 px-6 py-5 text-white">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black">Confirm Your Farm Location</h3>
              <p className="text-emerald-100 text-xs">Accurate weather, nearby machinery, and village group updates</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 text-amber-800 text-sm border border-amber-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Search Bar + GPS */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Quick Search (Village, Mandal or District)
            </label>
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Type village or town name..."
                className="w-full !pl-11 pr-24 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition min-h-[44px]"
              />
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={detectingGps}
                className="absolute right-2 top-2 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center gap-1 transition"
              >
                {detectingGps ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                <span>GPS</span>
              </button>
            </div>

            {/* Suggestions list */}
            {searching && (
              <div className="flex items-center gap-2 p-3 text-xs text-gray-500 bg-gray-50 rounded-xl">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Searching villages and regions across India...</span>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="border border-emerald-100 rounded-2xl bg-white shadow-lg overflow-hidden divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left p-3 hover:bg-emerald-50/70 transition flex items-center justify-between text-xs group"
                  >
                    <div className="flex items-center gap-2 pr-2 overflow-hidden">
                      <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="truncate text-gray-800 font-medium">{item.display_name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-400 font-semibold">Or review & edit details</span>
            </div>
          </div>

          {/* Structured Fields */}
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Village / Town *</label>
                <input
                  type="text"
                  required
                  value={form.village}
                  onChange={(e) => setForm({ ...form, village: e.target.value })}
                  placeholder="e.g. Lingamvarigudem"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mandal / Taluk</label>
                <input
                  type="text"
                  value={form.mandal}
                  onChange={(e) => setForm({ ...form, mandal: e.target.value })}
                  placeholder="e.g. Miryalaguda"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">District *</label>
                <input
                  type="text"
                  required
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  placeholder="e.g. Nalgonda"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="e.g. Telangana"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>
            </div>

            {form.coordinates && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Geocoded: {form.coordinates.lat?.toFixed(4)}, {form.coordinates.lng?.toFixed(4)}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition"
              >
                Skip for Now
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Save Location</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default LocationConfirmationModal;

