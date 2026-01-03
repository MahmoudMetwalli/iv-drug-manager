import { ipcMain } from "electron";
import { getDb } from "./db/index";

export function setupIpc() {
  const db = getDb();

  // ============= AUTH =============
  ipcMain.handle("auth:login", (_, { username, password }) => {
    const user = db
      .prepare("SELECT * FROM users WHERE username = ? AND is_active = 1")
      .get(username) as any;
    if (!user || user.password_hash !== password) {
      throw new Error("Invalid credentials");
    }
    return {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      permissions: JSON.parse(user.permissions || "[]"),
    };
  });

  // ============= PATIENTS =============
  ipcMain.handle("patient:create", (_, patient) => {
    const stmt = db.prepare(`
      INSERT INTO patients (hospital_id, name, dob, gender, weight, height, department, notes, entry_date)
      VALUES (@hospital_id, @name, @dob, @gender, @weight, @height, @department, @notes, @entry_date)
    `);
    const info = stmt.run(patient);
    return { id: info.lastInsertRowid, ...patient };
  });

  ipcMain.handle("patient:get", (_, id) => {
    return db.prepare("SELECT * FROM patients WHERE id = ?").get(id);
  });

  ipcMain.handle("patient:list", (_, { date }) => {
    return db.prepare("SELECT * FROM patients WHERE entry_date = ?").all(date);
  });

  ipcMain.handle("patient:listAll", () => {
    return db.prepare("SELECT * FROM patients ORDER BY created_at DESC").all();
  });

  ipcMain.handle("patient:update", (_, patient) => {
    const stmt = db.prepare(`
      UPDATE patients 
      SET hospital_id = @hospital_id, 
          name = @name, 
          dob = @dob, 
          gender = @gender, 
          weight = @weight, 
          height = @height, 
          department = @department, 
          notes = @notes,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `);
    stmt.run(patient);
    return { success: true, ...patient };
  });

  ipcMain.handle("patient:delete", (_, id) => {
    // First delete related preparations
    db.prepare("DELETE FROM preparations WHERE patient_id = ?").run(id);
    // Then delete patient
    db.prepare("DELETE FROM patients WHERE id = ?").run(id);
    return { success: true };
  });

  ipcMain.handle("patient:copyToDate", (_, { patientIds, targetDate }) => {
    const selectStmt = db.prepare("SELECT * FROM patients WHERE id = ?");
    const insertStmt = db.prepare(`
      INSERT INTO patients (hospital_id, name, dob, gender, weight, height, department, notes, entry_date)
      VALUES (@hospital_id, @name, @dob, @gender, @weight, @height, @department, @notes, @entry_date)
    `);

    const copiedPatients: Array<{ id: number | bigint }> = [];
    const copyTransaction = db.transaction((ids: number[]) => {
      for (const id of ids) {
        const patient = selectStmt.get(id) as any;
        if (patient) {
          const result = insertStmt.run({
            hospital_id: patient.hospital_id,
            name: patient.name,
            dob: patient.dob,
            gender: patient.gender,
            weight: patient.weight,
            height: patient.height,
            department: patient.department,
            notes: patient.notes,
            entry_date: targetDate,
          });
          copiedPatients.push({ id: result.lastInsertRowid });
        }
      }
    });

    copyTransaction(patientIds);
    return { success: true, copiedCount: copiedPatients.length };
  });

  // ============= PREPARATIONS =============
  ipcMain.handle("prep:create", (_, prep) => {
    const stmt = db.prepare(`
      INSERT INTO preparations (patient_id, date, drug_id, drug_name, data_json, status)
      VALUES (@patient_id, @date, @drug_id, @drug_name, @data_json, @status)
    `);
    const info = stmt.run(prep);
    return { id: info.lastInsertRowid, ...prep };
  });

  ipcMain.handle("prep:list", (_, { patient_id }) => {
    return db
      .prepare("SELECT * FROM preparations WHERE patient_id = ?")
      .all(patient_id);
  });

  ipcMain.handle("prep:update", (_, { id, data_json, status }) => {
    const stmt = db.prepare(`
      UPDATE preparations SET data_json = @data_json, status = @status WHERE id = @id
    `);
    stmt.run({ id, data_json, status });
    return { success: true };
  });

  // ============= DRUGS =============
  ipcMain.handle("drug:list", (_, { search } = { search: "" }) => {
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      return db
        .prepare(
          `
          SELECT * FROM drugs 
          WHERE trade_name LIKE ? 
             OR generic_name LIKE ? 
             OR arabic_name LIKE ?
          ORDER BY trade_name
        `
        )
        .all(searchTerm, searchTerm, searchTerm);
    }
    return db.prepare("SELECT * FROM drugs ORDER BY trade_name").all();
  });

  ipcMain.handle("drug:get", (_, id) => {
    return db.prepare("SELECT * FROM drugs WHERE id = ?").get(id);
  });

  ipcMain.handle("drug:create", (_, drug) => {
    const stmt = db.prepare(`
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
    const info = stmt.run(drug);
    return { id: info.lastInsertRowid, ...drug };
  });

  ipcMain.handle("drug:update", (_, drug) => {
    const stmt = db.prepare(`
      UPDATE drugs SET
        trade_name = @trade_name, generic_name = @generic_name, arabic_name = @arabic_name,
        form = @form, container = @container, amount_mg = @amount_mg, amount_volume_ml = @amount_volume_ml,
        concentration_mg_ml = @concentration_mg_ml, reconstitution_volume_ml = @reconstitution_volume_ml,
        reconstitution_concentration_mg_ml = @reconstitution_concentration_mg_ml,
        reconstitution_diluent_ns = @reconstitution_diluent_ns, 
        reconstitution_diluent_d5w = @reconstitution_diluent_d5w,
        reconstitution_diluent_swi = @reconstitution_diluent_swi,
        reconstitution_stability_room_hours = @reconstitution_stability_room_hours,
        reconstitution_stability_refrigeration_days = @reconstitution_stability_refrigeration_days,
        initial_dilution_volume_ml = @initial_dilution_volume_ml,
        initial_dilution_concentration_mg_ml = @initial_dilution_concentration_mg_ml,
        fd_each_ml_up_to = @fd_each_ml_up_to, fd_concentration_mg_ml = @fd_concentration_mg_ml,
        fdfr_each_ml_up_to = @fdfr_each_ml_up_to, fdfr_concentration_mg_ml = @fdfr_concentration_mg_ml,
        fd_diluent_ns = @fd_diluent_ns, fd_diluent_d5w = @fd_diluent_d5w,
        fd_stability_room_hours = @fd_stability_room_hours,
        fd_stability_refrigeration_days = @fd_stability_refrigeration_days,
        infusion_time_min = @infusion_time_min, is_photosensitive = @is_photosensitive,
        is_biohazard = @is_biohazard, min_dose_mg_kg_dose = @min_dose_mg_kg_dose,
        max_dose_mg_kg_dose = @max_dose_mg_kg_dose, max_dose_mg_dose = @max_dose_mg_dose,
        max_dose_mg_day = @max_dose_mg_day, obese_patient_dosage_adjustment = @obese_patient_dosage_adjustment,
        instructions_text = @instructions_text, target_volume_ml = @target_volume_ml,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `);
    stmt.run(drug);
    return { success: true, ...drug };
  });

  ipcMain.handle("drug:delete", (_, id) => {
    db.prepare("DELETE FROM drugs WHERE id = ?").run(id);
    return { success: true };
  });

  // ============= USERS =============
  ipcMain.handle("user:list", () => {
    const users = db
      .prepare(
        `
      SELECT id, username, display_name, role, permissions, is_active, created_at
      FROM users ORDER BY created_at DESC
    `
      )
      .all() as any[];
    return users.map((u) => ({
      ...u,
      permissions: JSON.parse(u.permissions || "[]"),
    }));
  });

  ipcMain.handle("user:create", (_, user) => {
    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role, permissions, is_active)
      VALUES (@username, @password, @display_name, @role, @permissions, 1)
    `);
    const info = stmt.run({
      username: user.username,
      password: user.password,
      display_name: user.display_name,
      role: user.role,
      permissions: JSON.stringify(user.permissions || []),
    });
    return { id: info.lastInsertRowid, ...user };
  });

  ipcMain.handle("user:update", (_, user) => {
    if (user.password) {
      // Update with password change
      db.prepare(
        `
        UPDATE users SET
          display_name = @display_name,
          role = @role,
          permissions = @permissions,
          is_active = @is_active,
          password_hash = @password,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `
      ).run({
        id: user.id,
        display_name: user.display_name,
        role: user.role,
        permissions: JSON.stringify(user.permissions || []),
        is_active: user.is_active ? 1 : 0,
        password: user.password,
      });
    } else {
      // Update without password change
      db.prepare(
        `
        UPDATE users SET
          display_name = @display_name,
          role = @role,
          permissions = @permissions,
          is_active = @is_active,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `
      ).run({
        id: user.id,
        display_name: user.display_name,
        role: user.role,
        permissions: JSON.stringify(user.permissions || []),
        is_active: user.is_active ? 1 : 0,
      });
    }
    return { success: true };
  });

  ipcMain.handle("user:delete", (_, id) => {
    // Soft delete - just deactivate
    db.prepare("UPDATE users SET is_active = 0 WHERE id = ?").run(id);
    return { success: true };
  });

  // ============= AUDIT LOGS =============
  ipcMain.handle(
    "audit:log",
    (_, { userId, username, action, entityType, entityId, details }) => {
      db.prepare(
        `
      INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `
      ).run(
        userId,
        username,
        action,
        entityType,
        entityId,
        JSON.stringify(details)
      );
      return { success: true };
    }
  );

  ipcMain.handle("audit:list", (_, filters = {}) => {
    let query = "SELECT * FROM audit_logs WHERE 1=1";
    const params: any[] = [];

    if (filters.userId) {
      query += " AND user_id = ?";
      params.push(filters.userId);
    }
    if (filters.action) {
      query += " AND action = ?";
      params.push(filters.action);
    }
    if (filters.entityType) {
      query += " AND entity_type = ?";
      params.push(filters.entityType);
    }
    if (filters.startDate) {
      query += " AND timestamp >= ?";
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += " AND timestamp <= ?";
      params.push(filters.endDate);
    }

    query += " ORDER BY timestamp DESC LIMIT 500";

    return db.prepare(query).all(...params);
  });
}
