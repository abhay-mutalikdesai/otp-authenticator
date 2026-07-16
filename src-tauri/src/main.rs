#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
};
use std::sync::atomic::{AtomicI64, AtomicBool, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

static LAST_BLUR: AtomicI64 = AtomicI64::new(0);
static IGNORE_BLUR: AtomicBool = AtomicBool::new(false);
static IS_WINDOW_MODE: AtomicBool = AtomicBool::new(false);
static IS_LOCKED: AtomicBool = AtomicBool::new(true);
static HAS_MASTER_PW: AtomicBool = AtomicBool::new(false);

struct AppState {
    last_tray_pos: std::sync::Mutex<Option<tauri::PhysicalPosition<f64>>>,
}

fn calculate_tray_position(position: &tauri::PhysicalPosition<f64>, window: &tauri::Window) -> tauri::PhysicalPosition<i32> {
    if let Ok(window_size) = window.outer_size() {
        if let Ok(monitors) = window.available_monitors() {
            for m in monitors {
                let m_pos = m.position();
                let m_size = m.size();
                if position.x >= m_pos.x as f64 && position.x <= (m_pos.x + m_size.width as i32) as f64 &&
                   position.y >= m_pos.y as f64 && position.y <= (m_pos.y + m_size.height as i32) as f64 {
                    
                    let mut x = position.x as i32 - (window_size.width / 2) as i32;
                    let mut y = position.y as i32 - window_size.height as i32 - 10;
                    
                    if (position.y as i32 - m_pos.y) < (m_size.height as i32 / 2) {
                        y = position.y as i32 + 10; // Taskbar is on top
                    }
                    
                    if x < m_pos.x {
                        x = m_pos.x + 10;
                    } else if x + window_size.width as i32 > m_pos.x + m_size.width as i32 {
                        x = m_pos.x + m_size.width as i32 - window_size.width as i32 - 10;
                    }
                    
                    return tauri::PhysicalPosition { x, y };
                }
            }
        }
        let x = position.x as i32 - (window_size.width / 2) as i32;
        let y = position.y as i32 - window_size.height as i32 - 10;
        return tauri::PhysicalPosition { x, y };
    }
    tauri::PhysicalPosition { x: position.x as i32, y: position.y as i32 }
}


#[tauri::command]
fn set_ignore_blur(ignore: bool) {
    IGNORE_BLUR.store(ignore, Ordering::SeqCst);
}

#[tauri::command]
fn set_auth_state(locked: bool, has_master: bool) {
    IS_LOCKED.store(locked, Ordering::SeqCst);
    HAS_MASTER_PW.store(has_master, Ordering::SeqCst);
}

#[tauri::command]
fn set_window_mode(mode: bool, window: tauri::Window, state: tauri::State<AppState>) {
    IS_WINDOW_MODE.store(mode, Ordering::SeqCst);
    let _ = window.set_always_on_top(true);
    if !mode {
        if let Some(position) = *state.last_tray_pos.lock().unwrap() {
            let new_pos = calculate_tray_position(&position, &window);
            let _ = window.set_position(tauri::Position::Physical(new_pos));
        }
    }
}



#[tauri::command]
fn reset_window_position(window: tauri::Window, state: tauri::State<AppState>) {
    if let Some(position) = *state.last_tray_pos.lock().unwrap() {
        let new_pos = calculate_tray_position(&position, &window);
        let _ = window.set_position(tauri::Position::Physical(new_pos));
    }
}

fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let tray_menu = SystemTrayMenu::new().add_item(quit);
    let system_tray = SystemTray::new()
        .with_tooltip("OTP Authenticator")
        .with_menu(tray_menu);

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            // A second instance was launched — focus the existing window instead
            if let Some(window) = app.get_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .manage(AppState {
            last_tray_pos: std::sync::Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![set_ignore_blur, set_window_mode, reset_window_position, set_auth_state])
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick { position, .. } => {
                let state: tauri::State<AppState> = app.state();
                *state.last_tray_pos.lock().unwrap() = Some(position);
                let window = app.get_window("main").unwrap();
                let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as i64;
                let last_blur = LAST_BLUR.load(Ordering::SeqCst);
                let is_window_mode = IS_WINDOW_MODE.load(Ordering::SeqCst);
                let locked = IS_LOCKED.load(Ordering::SeqCst);
                let has_master = HAS_MASTER_PW.load(Ordering::SeqCst);
                let _was_focused = now - last_blur < 400;

                if window.is_visible().unwrap() {
                    IGNORE_BLUR.store(false, Ordering::SeqCst);
                    window.hide().unwrap();
                } else if now - last_blur > 400 { 
                    // Only show if it didn't *just* hide due to losing focus from this exact click
                    let mut should_reset_pos = true;
                    if is_window_mode && !locked && has_master {
                        should_reset_pos = false;
                    }

                    if should_reset_pos {
                        let new_pos = calculate_tray_position(&position, &window);
                        let _ = window.set_position(tauri::Position::Physical(new_pos));
                    }
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
            SystemTrayEvent::MenuItemClick { id, .. } => {
                if id.as_str() == "quit" {
                    std::process::exit(0);
                }
            }
            _ => {}
        })
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::Focused(is_focused) => {
                if *is_focused {
                    // Always reset ignore flag when window regains focus, unless in window mode
                    if !IS_WINDOW_MODE.load(Ordering::SeqCst) {
                        IGNORE_BLUR.store(false, Ordering::SeqCst);
                    }
                } else {
                    LAST_BLUR.store(
                        SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as i64,
                        Ordering::SeqCst,
                    );
                    if !IS_WINDOW_MODE.load(Ordering::SeqCst) && !IGNORE_BLUR.load(Ordering::SeqCst) {
                        event.window().hide().unwrap();
                    }
                }
            }
            tauri::WindowEvent::Resized(_) => {
                // No-op: the window is non-resizable via config.
            }
            tauri::WindowEvent::ScaleFactorChanged { .. } => {
                // When dragging to a monitor with a different DPI, Windows fires this event.
                // WebView2 with transparent + decorationless windows doesn't always resize the
                // content area correctly. Re-applying the logical size forces Tauri/WRY to
                // recompute the correct physical size for the new scale factor.
                let _ = event.window().set_size(tauri::Size::Logical(tauri::LogicalSize {
                    width: 380.0,
                    height: 580.0,
                }));
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
