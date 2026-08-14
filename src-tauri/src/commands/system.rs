/// Example command establishing the typed IPC pattern (lib/ipc on the frontend side).
/// Thin by design: no business logic, just orchestration, per CODING_STANDARDS.md.
#[tauri::command]
pub fn get_app_version(app: tauri::AppHandle) -> String {
    app.package_info().version.to_string()
}
