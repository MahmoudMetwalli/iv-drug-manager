import Database from "better-sqlite3";
import { app } from "electron";
import path from "path";
import { drugSeedData } from "./drug-seed-data";

let db: Database.Database;

export function getDb() {
  if (db) return db;

  // Use a fixed path/name for the database
  const dbPath = path.join(app.getPath("userData"), "iv_drug_manager.db");
  console.log("Database path:", dbPath);

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  return db;
}

export function initDb() {
  const database = getDb();

  // Run migrations first to ensure schema is up to date
  runMigrations(database);

  // Users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'pharmacist')) NOT NULL DEFAULT 'pharmacist',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create default admin if not exists
  const admin = database
    .prepare("SELECT * FROM users WHERE username = ?")
    .get("admin");
  if (!admin) {
    // Default admin: admin / admin (In real app, hash this!)
    database
      .prepare(
        "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)"
      )
      .run("admin", "admin", "admin");
  }

  // Patients table
  database.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hospital_id TEXT NOT NULL,
      name TEXT NOT NULL,
      dob TEXT NOT NULL,
      gender TEXT NOT NULL,
      weight REAL,
      height REAL,
      department TEXT,
      notes TEXT,
      entry_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Preparations table
  database.exec(`
    CREATE TABLE IF NOT EXISTS preparations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      drug_id INTEGER,
      drug_name TEXT NOT NULL,
      data_json TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending', 'completed')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id),
      FOREIGN KEY(drug_id) REFERENCES drugs(id)
    );
  `);

  // Drugs table - AIVPC V5.4 format
  database.exec(`
    CREATE TABLE IF NOT EXISTS drugs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trade_name TEXT NOT NULL,
      generic_name TEXT NOT NULL,
      arabic_name TEXT,
      form TEXT CHECK(form IN ('Powder', 'Solution')) NOT NULL,
      container TEXT CHECK(container IN ('Vial', 'Ampoule')) NOT NULL,
      amount_mg REAL NOT NULL,
      amount_volume_ml REAL,
      concentration_mg_ml REAL,
      
      -- Reconstitution details
      reconstitution_volume_ml REAL,
      reconstitution_concentration_mg_ml REAL,
      reconstitution_diluent_ns INTEGER DEFAULT 0,
      reconstitution_diluent_d5w INTEGER DEFAULT 0,
      reconstitution_diluent_swi INTEGER DEFAULT 0,
      reconstitution_stability_room_hours REAL,
      reconstitution_stability_refrigeration_days REAL,
      
      -- Initial dilution (for concentrated solutions)
      initial_dilution_volume_ml REAL,
      initial_dilution_concentration_mg_ml REAL,
      
      -- Further Dilution
      fd_each_ml_up_to REAL,
      fd_concentration_mg_ml REAL,
      fdfr_each_ml_up_to REAL,
      fdfr_concentration_mg_ml REAL,
      fd_diluent_ns INTEGER DEFAULT 0,
      fd_diluent_d5w INTEGER DEFAULT 0,
      fd_stability_room_hours REAL,
      fd_stability_refrigeration_days REAL,
      
      -- Administration
      infusion_time_min INTEGER,
      
      -- Alerts
      is_photosensitive INTEGER DEFAULT 0,
      is_biohazard INTEGER DEFAULT 0,
      
      -- Dosing ranges
      min_dose_mg_kg_dose REAL,
      max_dose_mg_kg_dose REAL,
      max_dose_mg_dose REAL,
      max_dose_mg_day REAL,
      obese_patient_dosage_adjustment TEXT,
      
      -- Instructions
      instructions_text TEXT,
      
      target_volume_ml REAL,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed drugs if table is empty
  const drugCount = database
    .prepare("SELECT COUNT(*) as count FROM drugs")
    .get() as { count: number };
  if (drugCount.count === 0) {
    seedDrugs(database);
  }
}

function seedDrugs(database: Database.Database) {
  const insertStmt = database.prepare(`
    INSERT INTO drugs (
      trade_name, generic_name, arabic_name, form, container, amount_mg, amount_volume_ml,
      concentration_mg_ml, reconstitution_volume_ml, reconstitution_concentration_mg_ml,
      reconstitution_diluent_ns, reconstitution_diluent_d5w, reconstitution_diluent_swi,
      reconstitution_stability_room_hours, reconstitution_stability_refrigeration_days,
      initial_dilution_volume_ml, initial_dilution_concentration_mg_ml,
      fd_each_ml_up_to, fd_concentration_mg_ml, fdfr_each_ml_up_to, fdfr_concentration_mg_ml,
      fd_diluent_ns, fd_diluent_d5w, fd_stability_room_hours, fd_stability_refrigeration_days,
      infusion_time_min, is_photosensitive, is_biohazard,
      min_dose_mg_kg_dose, max_dose_mg_kg_dose, max_dose_mg_dose, max_dose_mg_day,
      obese_patient_dosage_adjustment, instructions_text, target_volume_ml
    ) VALUES (
      @trade_name, @generic_name, @arabic_name, @form, @container, @amount_mg, @amount_volume_ml,
      @concentration_mg_ml, @reconstitution_volume_ml, @reconstitution_concentration_mg_ml,
      @reconstitution_diluent_ns, @reconstitution_diluent_d5w, @reconstitution_diluent_swi,
      @reconstitution_stability_room_hours, @reconstitution_stability_refrigeration_days,
      @initial_dilution_volume_ml, @initial_dilution_concentration_mg_ml,
      @fd_each_ml_up_to, @fd_concentration_mg_ml, @fdfr_each_ml_up_to, @fdfr_concentration_mg_ml,
      @fd_diluent_ns, @fd_diluent_d5w, @fd_stability_room_hours, @fd_stability_refrigeration_days,
      @infusion_time_min, @is_photosensitive, @is_biohazard,
      @min_dose_mg_kg_dose, @max_dose_mg_kg_dose, @max_dose_mg_dose, @max_dose_mg_day,
      @obese_patient_dosage_adjustment, @instructions_text, @target_volume_ml
    )
  `);

  const insertMany = database.transaction((drugs: typeof drugSeedData) => {
    for (const drug of drugs) {
      insertStmt.run(drug);
    }
  });

  insertMany(drugSeedData);
  console.log(`Seeded ${drugSeedData.length} drugs into the database`);
}

function runMigrations(database: Database.Database) {
  // Check if updated_at column exists in patients table
  const patientsColumns = database
    .prepare("PRAGMA table_info(patients)")
    .all() as Array<{ name: string }>;
  const hasUpdatedAt = patientsColumns.some((col) => col.name === "updated_at");

  if (!hasUpdatedAt && patientsColumns.length > 0) {
    console.log("Migration: Adding updated_at column to patients table");
    database.exec("ALTER TABLE patients ADD COLUMN updated_at DATETIME");
  }
}
