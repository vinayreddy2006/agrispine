import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import Swal from "sweetalert2";
import { Plus, Edit2, Trash2 } from "lucide-react";

const AdminSchemes = () => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "", provider: "", amount: "", description: "", eligibility: "", applyDate: "", paymentDate: "", link: "", providerColor: "bg-blue-100 text-blue-700"
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      const { data } = await api.get("/admin/schemes");
      setSchemes(data);
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
        await api.put(`/admin/schemes/${editingId}`, formData);
        Swal.fire("Success", "Scheme updated", "success");
      } else {
        await api.post("/admin/schemes", formData);
        Swal.fire("Success", "Scheme added", "success");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: "", provider: "", amount: "", description: "", eligibility: "", applyDate: "", paymentDate: "", link: "", providerColor: "bg-blue-100 text-blue-700" });
      fetchSchemes();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || err.message || "Could not save scheme", "error");
    }
  };

  const handleEdit = (scheme) => {
    setFormData(scheme);
    setEditingId(scheme._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete this scheme?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/admin/schemes/${id}`);
      Swal.fire("Deleted", "Scheme has been removed.", "success");
      fetchSchemes();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Could not delete", "error");
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Government Schemes</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); }} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
          <Plus className="w-5 h-5" /> Add New Scheme
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-bold mb-4">{editingId ? "Edit Scheme" : "Add Scheme"}</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" required placeholder="Scheme Name" className="border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input type="text" required placeholder="Provider (e.g., Central Govt)" className="border p-2 rounded" value={formData.provider} onChange={e => setFormData({...formData, provider: e.target.value})} />
            <input type="text" required placeholder="Amount (e.g., ₹6000 / year)" className="border p-2 rounded" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
            <input type="text" required placeholder="Application Date" className="border p-2 rounded" value={formData.applyDate} onChange={e => setFormData({...formData, applyDate: e.target.value})} />
            <input type="text" required placeholder="Payment Date" className="border p-2 rounded" value={formData.paymentDate} onChange={e => setFormData({...formData, paymentDate: e.target.value})} />
            <input type="text" required placeholder="Official Link URL" className="border p-2 rounded" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
            <textarea required placeholder="Description" className="border p-2 rounded md:col-span-2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            <textarea required placeholder="Eligibility" className="border p-2 rounded md:col-span-2" value={formData.eligibility} onChange={e => setFormData({...formData, eligibility: e.target.value})} />
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
                <th className="p-4 font-semibold text-gray-600">Name</th>
                <th className="p-4 font-semibold text-gray-600">Provider</th>
                <th className="p-4 font-semibold text-gray-600">Amount</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schemes.map(s => (
                <tr key={s._id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{s.name}</td>
                  <td className="p-4 text-gray-600">{s.provider}</td>
                  <td className="p-4 text-gray-600">{s.amount}</td>
                  <td className="p-4 flex justify-end gap-2">
                    <button onClick={() => handleEdit(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(s._id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
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

export default AdminSchemes;
