import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Search,
  Sun,
  Biohazard,
  AlertTriangle,
} from "lucide-react";

interface Patient {
  id: number;
  hospital_id: string;
  name: string;
  dob: string;
  gender: string;
  weight: number;
  height: number;
  department: string;
}

interface Drug {
  id: number;
  trade_name: string;
  generic_name: string;
  arabic_name: string;
  form: string;
  container: string;
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
  min_dose_mg_kg_dose: number;
  max_dose_mg_kg_dose: number;
  max_dose_mg_dose: number;
  max_dose_mg_day: number;
  obese_patient_dosage_adjustment: string;
  instructions_text: string;
  target_volume_ml: number;
}

export default function PreparationWorksheet() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);

  // Drug Search State
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [drugSearch, setDrugSearch] = useState("");
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [showDrugDropdown, setShowDrugDropdown] = useState(false);

  // Prep Data State
  const [dose, setDose] = useState("");
  const [doseUnit, setDoseUnit] = useState("mg/kg/dose");
  const [interval, setInterval] = useState("");
  const [bsa, setBsa] = useState("0.00");
  const [bmi, setBmi] = useState("0.00");

  // Load drugs on mount
  useEffect(() => {
    window.ipcRenderer.invoke("drug:list", { search: "" }).then(setDrugs);
  }, []);

  // Filter drugs based on search
  const filteredDrugs = useMemo(() => {
    if (!drugSearch.trim()) return drugs;
    const term = drugSearch.toLowerCase();
    return drugs.filter(
      (d) =>
        d.trade_name.toLowerCase().includes(term) ||
        d.generic_name.toLowerCase().includes(term) ||
        d.arabic_name.includes(term)
    );
  }, [drugs, drugSearch]);

  useEffect(() => {
    if (patientId) {
      window.ipcRenderer
        .invoke("patient:get", Number(patientId))
        .then((data) => {
          setPatient(data);
          if (data.weight && data.height) {
            // Du Bois formula
            const bsaValue =
              0.007184 *
              Math.pow(data.weight, 0.425) *
              Math.pow(data.height, 0.725);
            setBsa(bsaValue.toFixed(2));

            const bmiValue = data.weight / Math.pow(data.height / 100, 2);
            setBmi(bmiValue.toFixed(2));
          }
        })
        .catch((err) => console.error(err));
    }
  }, [patientId]);

  const handleSelectDrug = (drug: Drug) => {
    setSelectedDrug(drug);
    setDrugSearch(drug.trade_name);
    setShowDrugDropdown(false);
  };

  // Calculate dose
  const calculatedDose = useMemo(() => {
    if (!dose || !patient?.weight) return null;
    const doseNum = parseFloat(dose);
    if (isNaN(doseNum)) return null;

    if (doseUnit === "mg/kg/dose") {
      return doseNum * patient.weight;
    }
    return doseNum;
  }, [dose, patient?.weight, doseUnit]);

  // Get diluent string
  const getDiluentString = (ns: number, d5w: number, swi: number) => {
    const diluents = [];
    if (ns) diluents.push("NS");
    if (d5w) diluents.push("D5W");
    if (swi) diluents.push("SWI");
    return diluents.join(" / ") || "N/A";
  };

  const handleSave = async () => {
    if (!patientId || !selectedDrug) {
      alert("Please select a drug");
      return;
    }
    try {
      const prepData = {
        drug: selectedDrug,
        dose,
        doseUnit,
        interval,
        calculatedDose,
        bsa,
        bmi,
      };

      await window.ipcRenderer.invoke("prep:create", {
        patient_id: patientId,
        drug_id: selectedDrug.id,
        date: new Date().toISOString().split("T")[0],
        drug_name: selectedDrug.trade_name,
        data_json: JSON.stringify(prepData),
        status: "pending",
      });
      alert("Preparation saved!");
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert("Failed to save");
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-blue-600"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to List
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          IV Preparation Worksheet
        </h1>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel: Patient Info */}
        <div className="col-span-3 bg-white p-4 rounded-lg shadow border border-gray-200 h-fit">
          <h2 className="font-semibold text-gray-700 mb-4 border-b pb-2">
            Patient Details
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-500 block">Name</span>
              <span className="font-medium text-lg">
                {patient?.name || "Loading..."}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Hospital ID</span>
              <span className="font-medium">{patient?.hospital_id || "-"}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-500 block">DOB</span>
                <span>{patient?.dob || "-"}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Gender</span>
                <span className="capitalize">{patient?.gender || "-"}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-500 block">Weight</span>
                <span className="font-medium text-blue-600">
                  {patient?.weight} kg
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Height</span>
                <span>{patient?.height} cm</span>
              </div>
            </div>
            <div className="bg-yellow-50 p-2 rounded border border-yellow-200 mt-4 grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs text-yellow-700 font-bold block">
                  BSA (m²)
                </span>
                <span className="font-mono font-medium">{bsa}</span>
              </div>
              <div>
                <span className="text-xs text-yellow-700 font-bold block">
                  BMI
                </span>
                <span className="font-mono font-medium">{bmi}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Panel: Calculator */}
        <div className="col-span-6 bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="bg-blue-600 text-white p-2 rounded-t -mt-4 -mx-4 mb-4 text-center font-bold">
            Drug Calculator
          </div>

          <div className="space-y-6">
            {/* Drug Selection */}
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Drug Name
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={drugSearch}
                  onChange={(e) => {
                    setDrugSearch(e.target.value);
                    setShowDrugDropdown(true);
                  }}
                  onFocus={() => setShowDrugDropdown(true)}
                  className="w-full border-2 border-gray-300 rounded-md p-2 pl-10 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-colors"
                  placeholder="Search drug..."
                />
              </div>
              {showDrugDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredDrugs.length === 0 ? (
                    <div className="p-3 text-gray-500 text-sm">
                      No drugs found
                    </div>
                  ) : (
                    filteredDrugs.slice(0, 10).map((drug) => (
                      <button
                        key={drug.id}
                        onClick={() => handleSelectDrug(drug)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-medium">{drug.trade_name}</span>
                          <span className="text-gray-500 text-sm ml-2">
                            ({drug.generic_name})
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {drug.is_photosensitive === 1 && (
                            <Sun className="w-4 h-4 text-yellow-500" />
                          )}
                          {drug.is_biohazard === 1 && (
                            <Biohazard className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected Drug Info */}
            {selectedDrug && (
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-blue-800">
                    {selectedDrug.trade_name}
                  </span>
                  <span className="text-blue-600">
                    ({selectedDrug.generic_name})
                  </span>
                  {selectedDrug.is_photosensitive === 1 && (
                    <span className="bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                      <Sun className="w-3 h-3" /> Light Sensitive
                    </span>
                  )}
                  {selectedDrug.is_biohazard === 1 && (
                    <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                      <Biohazard className="w-3 h-3" /> Biohazard
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                  <div>
                    Form: {selectedDrug.form} {selectedDrug.container}{" "}
                    {selectedDrug.amount_mg}mg
                  </div>
                  <div>Infusion: {selectedDrug.infusion_time_min} min</div>
                </div>
              </div>
            )}

            {/* Dose */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Dose
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={dose}
                    onChange={(e) => setDose(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-l-md p-2 focus:border-blue-500 outline-none"
                    placeholder="Enter dose"
                  />
                  <select
                    value={doseUnit}
                    onChange={(e) => setDoseUnit(e.target.value)}
                    className="border-2 border-l-0 border-gray-300 rounded-r-md bg-gray-100 p-2 text-sm"
                  >
                    <option>mg/kg/dose</option>
                    <option>mg/dose</option>
                    <option>mcg/kg/dose</option>
                  </select>
                </div>
                {calculatedDose && (
                  <div className="mt-1 text-sm text-green-600 font-medium">
                    = {calculatedDose.toFixed(2)} mg
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Interval
                </label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-md p-2 focus:border-blue-500 outline-none"
                >
                  <option value="">Select...</option>
                  <option value="q6h">Every 6 hours</option>
                  <option value="q8h">Every 8 hours</option>
                  <option value="q12h">Every 12 hours</option>
                  <option value="q24h">Daily</option>
                  <option value="once">Once</option>
                </select>
              </div>
            </div>

            {/* Dose Range Warning */}
            {selectedDrug && dose && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <div className="flex items-center gap-1 text-yellow-700 font-bold mb-1">
                  <AlertTriangle className="w-4 h-4" /> Dose Range Check
                </div>
                <div className="text-sm text-gray-700">
                  <div>
                    Recommended: {selectedDrug.min_dose_mg_kg_dose} -{" "}
                    {selectedDrug.max_dose_mg_kg_dose} mg/kg/dose
                  </div>
                  {selectedDrug.max_dose_mg_dose > 0 && (
                    <div>
                      Max single dose: {selectedDrug.max_dose_mg_dose} mg
                    </div>
                  )}
                  {selectedDrug.max_dose_mg_day > 0 && (
                    <div>Max daily dose: {selectedDrug.max_dose_mg_day} mg</div>
                  )}
                </div>
              </div>
            )}

            {/* Preparation Details */}
            {selectedDrug && (
              <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-3">
                <h3 className="font-semibold text-gray-600 text-sm uppercase">
                  Preparation Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedDrug.reconstitution_volume_ml && (
                    <>
                      <div>
                        <span className="text-gray-500 block">
                          Reconstitution
                        </span>
                        <span className="font-medium">
                          {selectedDrug.reconstitution_volume_ml} ml →{" "}
                          {selectedDrug.reconstitution_concentration_mg_ml}{" "}
                          mg/ml
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Diluent</span>
                        <span className="font-medium">
                          {getDiluentString(
                            selectedDrug.reconstitution_diluent_ns,
                            selectedDrug.reconstitution_diluent_d5w,
                            selectedDrug.reconstitution_diluent_swi
                          )}
                        </span>
                      </div>
                    </>
                  )}
                  {selectedDrug.fd_each_ml_up_to && (
                    <>
                      <div>
                        <span className="text-gray-500 block">
                          Further Dilution
                        </span>
                        <span className="font-medium">
                          Each ml up to {selectedDrug.fd_each_ml_up_to} ml ={" "}
                          {selectedDrug.fd_concentration_mg_ml} mg/ml
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">FD Diluent</span>
                        <span className="font-medium">
                          {getDiluentString(
                            selectedDrug.fd_diluent_ns,
                            selectedDrug.fd_diluent_d5w,
                            0
                          )}
                        </span>
                      </div>
                    </>
                  )}
                  {selectedDrug.reconstitution_stability_room_hours && (
                    <div>
                      <span className="text-gray-500 block">
                        Stability (Room)
                      </span>
                      <span className="font-medium">
                        {selectedDrug.reconstitution_stability_room_hours} hours
                      </span>
                    </div>
                  )}
                  {selectedDrug.reconstitution_stability_refrigeration_days && (
                    <div>
                      <span className="text-gray-500 block">
                        Stability (Refrigerated)
                      </span>
                      <span className="font-medium">
                        {
                          selectedDrug.reconstitution_stability_refrigeration_days
                        }{" "}
                        days
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={!selectedDrug}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded shadow flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" /> Save Preparation
            </button>
          </div>
        </div>

        {/* Right Panel: Instructions */}
        <div className="col-span-3 bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="bg-red-500 text-white p-2 rounded-t -mt-4 -mx-4 mb-4 text-center font-bold">
            Instructions
          </div>
          <div className="prose prose-sm">
            {selectedDrug ? (
              <p className="text-gray-700 text-sm whitespace-pre-line">
                {selectedDrug.instructions_text}
              </p>
            ) : (
              <p className="text-gray-500 italic">
                Select a drug to see preparation instructions...
              </p>
            )}

            {selectedDrug?.obese_patient_dosage_adjustment && (
              <div className="mt-4 bg-orange-50 p-2 rounded border border-orange-200">
                <span className="text-xs text-orange-700 font-bold block">
                  Obese Patient Adjustment
                </span>
                <span className="text-sm">
                  {selectedDrug.obese_patient_dosage_adjustment}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
