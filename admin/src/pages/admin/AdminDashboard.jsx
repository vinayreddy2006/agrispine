import React, { useState } from "react";
import api from "../../utils/api";
import Swal from "sweetalert2";

const AdminDashboard = () => {
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const token = localStorage.getItem("adminToken");
      const { data } = await api.post("/admin/seed", {}, {
        headers: { "admin-token": token }
      });
      Swal.fire("Success", data.message, "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to seed data: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <button 
          onClick={handleSeed}
          disabled={seeding}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold shadow-sm"
        >
          {seeding ? "Seeding..." : "Seed Default Data"}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-gray-500 font-medium">Total Users</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">1,248</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-gray-500 font-medium">Active Schemes</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">12</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-gray-500 font-medium">Mandi Rates Updated</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">Today</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
