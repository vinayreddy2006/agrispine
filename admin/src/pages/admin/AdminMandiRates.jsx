import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import Swal from "sweetalert2";
import { Plus, Edit2, Trash2 } from "lucide-react";

const AdminMandiRates = () => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    market: "", crop: "", type: "", min: "", max: "", modal: "", trend: "stable"
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const { data } = await api.get("/admin/mandi-rates");
      setRates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/mandi-rates/${editingId}`, formData);
        Swal.fire("Success", "Rate updated", "success");
      } else {
        await api.post("/admin/mandi-rates", formData);
        Swal.fire("Success", "Rate added", "success");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ market: "", crop: "", type: "", min: "", max: "", modal: "", trend: "stable" });
      fetchRates();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || err.message || "Could not save rate", "error");
    }
  };

  const handleEdit = (rate) => {
    setFormData(rate);
    setEditingId(rate._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete this rate?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/admin/mandi-rates/${id}`);
      Swal.fire("Deleted", "Rate has been removed.", "success");
      fetchRates();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || err.message || "Could not delete", "error");
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Mandi Rates</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); }} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
          <Plus className="w-5 h-5" /> Add New Rate
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-bold mb-4">{editingId ? "Edit Rate" : "Add Rate"}</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Market (e.g., Warangal)" className="border p-2 rounded" value={formData.market} onChange={e => setFormData({...formData, market: e.target.value})} />
            <input required placeholder="Crop (e.g., Cotton)" className="border p-2 rounded" value={formData.crop} onChange={e => setFormData({...formData, crop: e.target.value})} />
            <input required placeholder="Type (e.g., Fiber)" className="border p-2 rounded" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} />
            <select className="border p-2 rounded" value={formData.trend} onChange={e => setFormData({...formData, trend: e.target.value})}>
              <option value="up">Up</option>
              <option value="down">Down</option>
              <option value="stable">Stable</option>
            </select>
            <input required type="number" placeholder="Min Price" className="border p-2 rounded" value={formData.min} onChange={e => setFormData({...formData, min: e.target.value})} />
            <input required type="number" placeholder="Max Price" className="border p-2 rounded" value={formData.max} onChange={e => setFormData({...formData, max: e.target.value})} />
            <input required type="number" placeholder="Modal Price" className="border p-2 rounded" value={formData.modal} onChange={e => setFormData({...formData, modal: e.target.value})} />
            
            <div className="md:col-span-2 flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Save</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p>Loading...</p> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Market</th>
                <th className="p-4 font-semibold text-gray-600">Crop</th>
                <th className="p-4 font-semibold text-gray-600">Modal Price</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rates.map(r => (
                <tr key={r._id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{r.market}</td>
                  <td className="p-4 text-gray-600">{r.crop}</td>
                  <td className="p-4 text-gray-600">₹{r.modal}</td>
                  <td className="p-4 flex justify-end gap-2">
                    <button onClick={() => handleEdit(r)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(r._id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminMandiRates;
