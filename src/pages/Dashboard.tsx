import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar, Plus, Pencil, Trash2, Copy } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Define Patient Interface
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

import AddPatientModal from "../components/AddPatientModal";
import EditPatientModal from "../components/EditPatientModal";
import ImportPatientsModal from "../components/ImportPatientsModal";

export default function Dashboard() {
  const { user } = useAuth();
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    loadPatients();
  }, [date]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await window.ipcRenderer.invoke("patient:list", { date });
      setPatients(data);
    } catch (err) {
      console.error("Failed to load patients", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (patientId: number) => {
    try {
      await window.ipcRenderer.invoke("patient:delete", patientId);
      setDeleteConfirm(null);
      loadPatients();
    } catch (err) {
      console.error("Failed to delete patient", err);
      alert("Failed to delete patient");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Top Bar / Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex flex-col border-l pl-4">
            <span className="text-xs text-gray-500 uppercase font-semibold">
              Patients Count
            </span>
            <span className="text-xl font-bold text-blue-600">
              {patients.length}
            </span>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center gap-2 font-medium shadow-sm transition-colors"
            >
              <Copy className="w-4 h-4" /> Import Patients
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 font-medium shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Patient
            </button>
          </div>
        )}
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Hospital ID</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Patient Name</th>
                <th className="px-6 py-3">DOB</th>
                <th className="px-6 py-3">Gender</th>
                <th className="px-6 py-3">Weight (kg)</th>
                <th className="px-6 py-3">Height (cm)</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    Loading...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No patients found for this date.
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-6 py-3 font-medium">
                      {patient.hospital_id}
                    </td>
                    <td className="px-6 py-3">{patient.department}</td>
                    <td className="px-6 py-3 text-gray-900 font-medium">
                      {patient.name}
                    </td>
                    <td className="px-6 py-3">{patient.dob}</td>
                    <td className="px-6 py-3 capitalize">{patient.gender}</td>
                    <td className="px-6 py-3">{patient.weight}</td>
                    <td className="px-6 py-3">{patient.height}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/prep/${patient.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                          V. Prep
                        </Link>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(patient)}
                              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded"
                              title="Edit Patient"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {deleteConfirm === patient.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(patient.id)}
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
                                onClick={() => setDeleteConfirm(patient.id)}
                                className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded"
                                title="Delete Patient"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadPatients}
        selectedDate={date}
      />

      <EditPatientModal
        isOpen={isEditModalOpen}
        patient={selectedPatient}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPatient(null);
        }}
        onSuccess={loadPatients}
      />

      <ImportPatientsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={loadPatients}
        targetDate={date}
      />
    </div>
  );
}
