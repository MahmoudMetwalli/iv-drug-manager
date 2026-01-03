import { useState, useEffect } from "react";
import { X, Loader2, Sun, Biohazard } from "lucide-react";

interface Drug {
  id?: number;
  trade_name: string;
  generic_name: string;
  arabic_name: string;
  form: "Powder" | "Solution";
  container: "Vial" | "Ampoule";
  amount_mg: number;
  amount_volume_ml: number | null;
  concentration_mg_ml: number | null;
  reconstitution_volume_ml: number | null;
  reconstitution_concentration_mg_ml: number | null;
  reconstitution_diluent_ns: number;
  reconstitution_diluent_d5w: number;
  reconstitution_diluent_swi: number;
  reconstitution_stability_room_hours: number | null;
  reconstitution_stability_refrigeration_days: number | null;
  initial_dilution_volume_ml: number | null;
  initial_dilution_concentration_mg_ml: number | null;
  fd_each_ml_up_to: number | null;
  fd_concentration_mg_ml: number | null;
  fdfr_each_ml_up_to: number | null;
  fdfr_concentration_mg_ml: number | null;
  fd_diluent_ns: number;
  fd_diluent_d5w: number;
  fd_stability_room_hours: number | null;
  fd_stability_refrigeration_days: number | null;
  infusion_time_min: number;
  is_photosensitive: number;
  is_biohazard: number;
  min_dose_mg_kg_dose: number | null;
  max_dose_mg_kg_dose: number | null;
  max_dose_mg_dose: number | null;
  max_dose_mg_day: number | null;
  obese_patient_dosage_adjustment: string;
  instructions_text: string;
  target_volume_ml: number | null;
}

interface DrugFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  drug?: Drug | null;
}

const emptyDrug: Omit<Drug, "id"> = {
  trade_name: "",
  generic_name: "",
  arabic_name: "",
  form: "Powder",
  container: "Vial",
  amount_mg: 0,
  amount_volume_ml: null,
  concentration_mg_ml: null,
  reconstitution_volume_ml: null,
  reconstitution_concentration_mg_ml: null,
  reconstitution_diluent_ns: 0,
  reconstitution_diluent_d5w: 0,
  reconstitution_diluent_swi: 0,
  reconstitution_stability_room_hours: null,
  reconstitution_stability_refrigeration_days: null,
  initial_dilution_volume_ml: null,
  initial_dilution_concentration_mg_ml: null,
  fd_each_ml_up_to: null,
  fd_concentration_mg_ml: null,
  fdfr_each_ml_up_to: null,
  fdfr_concentration_mg_ml: null,
  fd_diluent_ns: 0,
  fd_diluent_d5w: 0,
  fd_stability_room_hours: null,
  fd_stability_refrigeration_days: null,
  infusion_time_min: 0,
  is_photosensitive: 0,
  is_biohazard: 0,
  min_dose_mg_kg_dose: null,
  max_dose_mg_kg_dose: null,
  max_dose_mg_dose: null,
  max_dose_mg_day: null,
  obese_patient_dosage_adjustment: "",
  instructions_text: "",
  target_volume_ml: null,
};

export default function DrugFormModal({
  isOpen,
  onClose,
  onSuccess,
  drug,
}: DrugFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<Drug, "id"> & { id?: number }>(
    emptyDrug
  );

  const isEdit = !!drug?.id;

  useEffect(() => {
    if (drug) {
      setFormData(drug);
    } else {
      setFormData(emptyDrug);
    }
  }, [drug, isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await window.ipcRenderer.invoke("drug:update", formData);
      } else {
        await window.ipcRenderer.invoke("drug:create", formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${isEdit ? "update" : "add"} drug`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked ? 1 : 0 });
    } else if (type === "number") {
      setFormData({
        ...formData,
        [name]: value === "" ? null : parseFloat(value),
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit Drug" : "Add New Drug"}
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto flex-1 space-y-6"
        >
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide border-b pb-1">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Trade Name *
                </label>
                <input
                  type="text"
                  name="trade_name"
                  value={formData.trade_name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Generic Name *
                </label>
                <input
                  type="text"
                  name="generic_name"
                  value={formData.generic_name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Arabic Name
                </label>
                <input
                  type="text"
                  name="arabic_name"
                  value={formData.arabic_name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Form *
                </label>
                <select
                  name="form"
                  value={formData.form}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  required
                >
                  <option value="Powder">Powder</option>
                  <option value="Solution">Solution</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Container *
                </label>
                <select
                  name="container"
                  value={formData.container}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  required
                >
                  <option value="Vial">Vial</option>
                  <option value="Ampoule">Ampoule</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount (mg) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="amount_mg"
                  value={formData.amount_mg || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Volume (ml)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="amount_volume_ml"
                  value={formData.amount_volume_ml ?? ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Concentration (mg/ml)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="concentration_mg_ml"
                  value={formData.concentration_mg_ml ?? ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
              </div>
            </div>
          </div>

          {/* Reconstitution */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide border-b pb-1">
              Reconstitution
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Volume (ml)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="reconstitution_volume_ml"
                  value={formData.reconstitution_volume_ml ?? ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Concentration (mg/ml)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="reconstitution_concentration_mg_ml"
                  value={formData.reconstitution_concentration_mg_ml ?? ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Room Stability (hrs)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="reconstitution_stability_room_hours"
                  value={formData.reconstitution_stability_room_hours ?? ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Refrigerated (days)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="reconstitution_stability_refrigeration_days"
                  value={
                    formData.reconstitution_stability_refrigeration_days ?? ""
                  }
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="reconstitution_diluent_ns"
                  checked={formData.reconstitution_diluent_ns === 1}
                  onChange={handleChange}
                  className="rounded border-gray-300"
                />
                NS (Normal Saline)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="reconstitution_diluent_d5w"
                  checked={formData.reconstitution_diluent_d5w === 1}
                  onChange={handleChange}
                  className="rounded border-gray-300"
                />
                D5W
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="reconstitution_diluent_swi"
                  checked={formData.reconstitution_diluent_swi === 1}
                  onChange={handleChange}
                  className="rounded border-gray-300"
                />
                SWI (Sterile Water)
              </label>
            </div>
          </div>

          {/* Further Dilution */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide border-b pb-1">
              Further Dilution
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Each ml up to
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="fd_each_ml_up_to"
                  value={formData.fd_each_ml_up_to ?? ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Concentration (mg/ml)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="fd_concentration_mg_ml"
                  value={formData.fd_concentration_mg_ml ?? ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Room Stability (hrs)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="fd_stability_room_hours"
                  value={formData.fd_stability_room_hours ?? ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Refrigerated (days)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="fd_stability_refrigeration_days"
                  value={formData.fd_stability_refrigeration_days ?? ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="fd_diluent_ns"
                  checked={formData.fd_diluent_ns === 1}
                  onChange={handleChange}
                  className="rounded border-gray-300"
                />
                NS (Normal Saline)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="fd_diluent_d5w"
                  checked={formData.fd_diluent_d5w === 1}
                  onChange={handleChange}
                  className="rounded border-gray-300"
                />
                D5W
              </label>
            </div>
          </div>

          {/* Administration & Alerts */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide border-b pb-1">
              Administration & Alerts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Infusion Time (min)
                </label>
                <input
                  type="number"
                  name="infusion_time_min"
                  value={formData.infusion_time_min || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Target Volume (ml)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="target_volume_ml"
                  value={formData.target_volume_ml ?? ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
              </div>
              <div className="flex items-end gap-4 col-span-2">
                <label className="flex items-center gap-2 text-sm bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                  <input
                    type="checkbox"
                    name="is_photosensitive"
                    checked={formData.is_photosensitive === 1}
                    onChange={handleChange}
                    className="rounded border-gray-300"
                  />
                  <Sun className="w-4 h-4 text-yellow-600" />
                  Photosensitive
                </label>
                <label className="flex items-center gap-2 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
                  <input
                    type="checkbox"
                    name="is_biohazard"
                    checked={formData.is_biohazard === 1}
                    onChange={handleChange}
                    className="rounded border-gray-300"
                  />
                  <Biohazard className="w-4 h-4 text-red-600" />
                  Biohazard
                </label>
              </div>
            </div>
          </div>

          {/* Dosing */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide border-b pb-1">
              Dosing Limits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Min Dose (mg/kg/dose)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="min_dose_mg_kg_dose"
                  value={formData.min_dose_mg_kg_dose ?? ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Max Dose (mg/kg/dose)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="max_dose_mg_kg_dose"
                  value={formData.max_dose_mg_kg_dose ?? ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Max Dose (mg/dose)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="max_dose_mg_dose"
                  value={formData.max_dose_mg_dose ?? ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Max Daily (mg/day)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="max_dose_mg_day"
                  value={formData.max_dose_mg_day ?? ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide border-b pb-1">
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Obese Patient Adjustment
                </label>
                <textarea
                  name="obese_patient_dosage_adjustment"
                  value={formData.obese_patient_dosage_adjustment}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Instructions
                </label>
                <textarea
                  name="instructions_text"
                  value={formData.instructions_text}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              {loading && <Loader2 className="animate-spin h-4 w-4" />}
              {isEdit ? "Update Drug" : "Add Drug"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
