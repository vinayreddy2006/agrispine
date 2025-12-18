import { useState } from "react";
import api from "../utils/api"; 
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { Sprout, ArrowLeft, Loader2 } from "lucide-react";

const AddCrop = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cropName: "",
    area: "",
    sowingDate: new Date().toISOString().split("T")[0], // Default to today
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Get token from storage (Manual check, though API helper usually handles this if configured)
    const token = localStorage.getItem("token");

    try {
      await api.post("/crops/add", formData, {
        headers: { "auth-token": token } // Send the "Passport"
      });
      
      await Swal.fire({
          title: 'Success! 🌱',
          text: 'Your crop has been added successfully.',
          icon: 'success',
          confirmButtonColor: '#16a34a', // Matches Tailwind green-600
          confirmButtonText: 'Great!'
        });
      navigate("/dashboard"); // Go back to dashboard
      
    } catch (err) {
      console.error(err);

        Swal.fire({
            title: 'Error',
            text: 'Could not add crop. Please try again.',
            icon: 'error',
            confirmButtonColor: '#d33'
        });

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate("/dashboard")}
          className="flex items-center text-gray-500 hover:text-gray-800 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-green-100 p-3 rounded-full">
            <Sprout className="w-6 h-6 text-green-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Add New Crop</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Crop Name</label>
            <input 
              name="cropName"
              type="text" 
              placeholder="e.g. Wheat, Rice, Cotton" 
              value={formData.cropName}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Land Area (in Acres)</label>
            <input 
              name="area"
              type="number" 
              placeholder="e.g. 2.5" 
              step="0.1"
              value={formData.area}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sowing Date</label>
            <input 
              name="sowingDate"
              type="date" 
              value={formData.sowingDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-semibold flex justify-center items-center gap-2 transition
              ${loading ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Save Crop Cycle"}
          </button>
        </form>

      </div>
    </div>
  );
};

export default AddCrop;