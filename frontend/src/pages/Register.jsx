import { useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import { Sprout, Loader2 } from "lucide-react"; // Added Loader2 icon

const Register = () => {
  const [formData, setFormData] = useState({
    name: "", 
    phone: "", 
    password: "", 
    confirmPassword: "", // New field
    userType: "farmer", 
    village: "", 
    district: ""
  });
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // New Loading State
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user types to improve UX
    if (error) setError("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // 1. Client-side Validation
    if (formData.password !== formData.confirmPassword) {
      setError("❌ Passwords do not match!");
      return;
    }

    if (formData.password.length < 6) {
      setError("❌ Password must be at least 6 characters.");
      return;
    }

    // 2. Start Loading
    setIsLoading(true);
    setError("");

    try {
      // We don't send 'confirmPassword' to the backend
      const { confirmPassword, ...dataToSend } = formData;
      
      await api.post("/auth/register", dataToSend);
      
      alert("Registration Successful! Please Login.");
      navigate("/");
      
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      // 3. Stop Loading (whether success or fail)
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 py-10 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-green-100 p-3 rounded-full mb-3">
            <Sprout className="w-8 h-8 text-green-700" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
          <p className="text-gray-500 text-sm">Join the AgriSpine community</p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input name="name" type="text" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input name="phone" type="tel" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input name="password" type="password" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input name="confirmPassword" type="password" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">I am a...</label>
            <select name="userType" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-green-500 outline-none">
              <option value="farmer">Farmer</option>
              <option value="provider">Service Provider (Tractors)</option>
              <option value="buyer">Buyer (Trader/Mill)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
              <input name="village" type="text" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <input name="district" type="text" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
            </div>
          </div>

          {/* REGISTER BUTTON with Loading State */}
          <button 
            type="submit" 
            disabled={isLoading} 
            className={`w-full font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition duration-200 
              ${isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Register"
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 text-center animate-pulse">
            {error}
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")} className="text-green-600 font-bold cursor-pointer hover:underline">
            Login here
          </span>
        </p>

      </div>
    </div>
  );
};

export default Register;