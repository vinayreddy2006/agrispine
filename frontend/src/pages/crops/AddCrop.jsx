import { useState } from "react";
import api from "../../utils/api";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { Sprout, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import InlineFormError from "../../components/ui/InlineFormError";

const AddCrop = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    cropName: "",
    area: "",
    sowingDate: new Date().toISOString().split("T")[0],
  });

  const validate = () => {
    const errs = {};
    if (!formData.cropName.trim()) {
      errs.cropName = "Crop name is required (e.g. Cotton, Paddy, Chilli)";
    } else if (formData.cropName.trim().length < 2) {
      errs.cropName = "Crop name must be at least 2 characters";
    }

    const areaNum = Number(formData.area);
    if (!formData.area || isNaN(areaNum) || areaNum <= 0) {
      errs.area = "Please enter a valid farm area greater than 0 acres";
    } else if (areaNum > 10000) {
      errs.area = "Area cannot exceed 10,000 acres";
    }

    if (!formData.sowingDate) {
      errs.sowingDate = "Please choose a sowing date";
    } else {
      const selected = new Date(formData.sowingDate);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (selected > tomorrow) {
        errs.sowingDate = "Sowing date cannot be in the future";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear inline error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      await api.post("/crops/add", formData, {
        headers: { "auth-token": token }
      });

      await Swal.fire({
        title: 'Crop Added Successfully! 🌱',
        text: `${formData.cropName} (${formData.area} Acres) has been recorded in your farm records.`,
        icon: 'success',
        confirmButtonColor: '#16a34a',
        confirmButtonText: 'View Dashboard'
      });
      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      const backendMsg = err.response?.data?.message || err.response?.data?.error || 'Could not add crop. Please try again.';
      Swal.fire({
        title: 'Failed to Add Crop',
        text: backendMsg,
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-agriBg dark:bg-slate-950 p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">

        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6 transition min-h-[44px] py-2 pr-2 -ml-2 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> {t('dashboard.my_crops', { defaultValue: 'My Crops' })}
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-emerald-100 dark:bg-emerald-950/60 p-3 rounded-2xl">
            <Sprout className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('crop.add', { defaultValue: 'Add New Crop' })}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('crops_ui.add_crop_sub', 'Start a New Cultivation Cycle')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              {t('crop.name', { defaultValue: 'Crop Name' })} <span className="text-red-500">*</span>
            </label>
            <input
              name="cropName"
              type="text"
              placeholder="e.g. Cotton, Paddy, Chilli, Maize"
              value={formData.cropName}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border ${errors.cropName ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-slate-700 focus:ring-emerald-500'} rounded-xl focus:ring-2 outline-none text-sm text-gray-800 dark:text-gray-100 transition`}
            />
            <InlineFormError error={errors.cropName} id="cropName-error" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              {t('dashboard.area', { defaultValue: 'Area' })} ({t('crops_ui.acres', 'Acres')}) <span className="text-red-500">*</span>
            </label>
            <input
              name="area"
              type="number"
              placeholder="e.g. 2.5"
              step="0.1"
              value={formData.area}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border ${errors.area ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-slate-700 focus:ring-emerald-500'} rounded-xl focus:ring-2 outline-none text-sm text-gray-800 dark:text-gray-100 transition`}
            />
            <InlineFormError error={errors.area} id="area-error" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              {t('dashboard.sown', { defaultValue: 'Sowing Date' })} <span className="text-red-500">*</span>
            </label>
            <input
              name="sowingDate"
              type="date"
              value={formData.sowingDate}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border ${errors.sowingDate ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-slate-700 focus:ring-emerald-500'} rounded-xl focus:ring-2 outline-none text-sm text-gray-800 dark:text-gray-100 transition`}
            />
            <InlineFormError error={errors.sowingDate} id="sowingDate-error" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3 px-4 rounded-xl shadow-xs transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('common.loading', 'Saving Crop...')}</span>
              </>
            ) : (
              <span>{t('crops_ui.record_crop_btn', 'Save & Track Crop')}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCrop;
