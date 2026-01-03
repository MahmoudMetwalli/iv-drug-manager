import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Sun,
  Biohazard,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import DrugFormModal from "../components/DrugFormModal";

interface Drug {
  id: number;
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

export default function DrugsPage() {
  const { hasPermission } = useAuth();
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);

  const canManageDrugs = hasPermission("manage_drugs");

  useEffect(() => {
    loadDrugs();
  }, []);

  const loadDrugs = async () => {
    setLoading(true);
    try {
      const data = await window.ipcRenderer.invoke("drug:list", { search });
      setDrugs(data);
    } catch (err) {
      console.error("Failed to load drugs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await window.ipcRenderer.invoke("drug:list", { search });
      setDrugs(data);
    } catch (err) {
      console.error("Failed to search drugs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await window.ipcRenderer.invoke("drug:delete", id);
      setDeleteConfirm(null);
      loadDrugs();
    } catch (err) {
      console.error("Failed to delete drug", err);
      alert("Failed to delete drug");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Drug Database</h1>
        <p className="text-gray-500">
          AIVPC V5.4 IV Drug Preparation Reference
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by trade name, generic name, or Arabic name..."
            className="flex-1 border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded font-medium"
          >
            Search
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Total:{" "}
            <span className="font-bold text-blue-600">{drugs.length}</span>{" "}
            drugs
          </span>
          {canManageDrugs && (
            <button
              onClick={() => {
                setEditingDrug(null);
                setShowModal(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Drug
            </button>
          )}
        </div>
      </div>

      {/* Drug Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Loading drugs...
          </div>
        ) : drugs.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No drugs found.
          </div>
        ) : (
          drugs.map((drug) => (
            <div
              key={drug.id}
              className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{drug.trade_name}</h3>
                    <p className="text-blue-100 text-sm">
                      ({drug.generic_name})
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {drug.is_photosensitive === 1 && (
                      <span
                        className="bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded text-xs font-bold flex items-center gap-1"
                        title="Photosensitive"
                      >
                        <Sun className="w-3 h-3" />
                      </span>
                    )}
                    {drug.is_biohazard === 1 && (
                      <span
                        className="bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-bold flex items-center gap-1"
                        title="Biohazard"
                      >
                        <Biohazard className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-blue-200 text-sm mt-1" dir="rtl">
                  {drug.arabic_name}
                </p>
              </div>

              {/* Card Body */}
              <div className="p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Form:</span>
                  <span className="font-medium">
                    {drug.form} {drug.container}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-medium">{drug.amount_mg} mg</span>
                </div>
                {drug.reconstitution_volume_ml && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reconstitution:</span>
                    <span className="font-medium">
                      {drug.reconstitution_volume_ml} ml →{" "}
                      {drug.reconstitution_concentration_mg_ml} mg/ml
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Infusion:</span>
                  <span className="font-medium">
                    {drug.infusion_time_min} min
                  </span>
                </div>

                {/* Dose Range */}
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                  <div className="flex items-center gap-1 text-yellow-700 text-xs font-bold mb-1">
                    <AlertTriangle className="w-3 h-3" /> Dose Range
                  </div>
                  <div className="text-xs text-gray-600">
                    {drug.min_dose_mg_kg_dose} - {drug.max_dose_mg_kg_dose}{" "}
                    mg/kg/dose
                    {(drug.max_dose_mg_dose ?? 0) > 0 && (
                      <span className="block">
                        Max dose: {drug.max_dose_mg_dose} mg
                      </span>
                    )}
                    {(drug.max_dose_mg_day ?? 0) > 0 && (
                      <span className="block">
                        Max daily: {drug.max_dose_mg_day} mg
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              {canManageDrugs && (
                <div className="border-t p-2 flex justify-end gap-2 bg-gray-50">
                  <button
                    onClick={() => {
                      setEditingDrug(drug);
                      setShowModal(true);
                    }}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded"
                    title="Edit Drug"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {deleteConfirm === drug.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(drug.id)}
                        className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(drug.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded"
                      title="Delete Drug"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Drug Form Modal */}
      <DrugFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingDrug(null);
        }}
        onSuccess={loadDrugs}
        drug={editingDrug}
      />
    </div>
  );
}
