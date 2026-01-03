import { useState, useEffect } from "react";
import { X, Loader2, Calendar, Users, Check } from "lucide-react";
import { format, subDays } from "date-fns";

interface Patient {
  id: number;
  hospital_id: string;
  name: string;
  dob: string;
  gender: string;
  weight: number;
  height: number;
  department: string;
  notes?: string;
  entry_date: string;
}

interface ImportPatientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetDate: string;
}

export default function ImportPatientsModal({
  isOpen,
  onClose,
  onSuccess,
  targetDate,
}: ImportPatientsModalProps) {
  const [sourceDate, setSourceDate] = useState(
    format(subDays(new Date(targetDate), 1), "yyyy-MM-dd")
  );
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSourcePatients();
    }
  }, [isOpen, sourceDate]);

  const loadSourcePatients = async () => {
    setLoading(true);
    try {
      const data = await window.ipcRenderer.invoke("patient:list", {
        date: sourceDate,
      });
      setPatients(data);
      // Select all by default
      setSelectedIds(new Set(data.map((p: Patient) => p.id)));
    } catch (err) {
      console.error("Failed to load patients", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === patients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(patients.map((p) => p.id)));
    }
  };

  const togglePatient = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleImport = async () => {
    if (selectedIds.size === 0) return;

    setImporting(true);
    try {
      await window.ipcRenderer.invoke("patient:copyToDate", {
        patientIds: Array.from(selectedIds),
        targetDate,
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to import patients", err);
      alert("Failed to import patients");
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
          <div>
            <h2 className="text-lg font-semibold">Import Patients</h2>
            <p className="text-indigo-200 text-sm">
              Copy patients to {targetDate}
            </p>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Date Picker */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4" />
              Copy from:
            </label>
            <input
              type="date"
              value={sourceDate}
              onChange={(e) => setSourceDate(e.target.value)}
              max={targetDate}
              className="border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span className="font-medium text-indigo-600">
                {patients.length}
              </span>{" "}
              patients found
            </div>
          </div>
        </div>

        {/* Patient List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <Loader2 className="animate-spin w-8 h-8 mx-auto mb-2" />
              Loading patients...
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No patients found for this date. Try a different source date.
            </div>
          ) : (
            <div className="space-y-2">
              {/* Select All */}
              <div
                className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200"
                onClick={toggleSelectAll}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedIds.size === patients.length
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-gray-300"
                  }`}
                >
                  {selectedIds.size === patients.length && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className="font-medium text-gray-700">
                  Select All ({patients.length})
                </span>
              </div>

              {/* Patient Items */}
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedIds.has(patient.id)
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => togglePatient(patient.id)}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedIds.has(patient.id)
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedIds.has(patient.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {patient.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({patient.hospital_id})
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {patient.department} • {patient.gender} • {patient.weight}
                      kg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {selectedIds.size} patient(s) selected
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={importing || selectedIds.size === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {importing && <Loader2 className="animate-spin h-4 w-4" />}
              Import {selectedIds.size} Patient(s)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
