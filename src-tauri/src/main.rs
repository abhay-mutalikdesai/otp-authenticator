#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
};
use std::sync::atomic::{AtomicI64, AtomicBool, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

static LAST_BLUR: AtomicI64 = AtomicI64::new(0);
static IGNORE_BLUR: AtomicBool = AtomicBool::new(false);

#[tauri::command]
fn set_ignore_blur(ignore: bool) {
    IGNORE_BLUR.store(ignore, Ordering::SeqCst);
}

fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let tray_menu = SystemTrayMenu::new().add_item(quit);
    let system_tray = SystemTray::new()
        .with_tooltip("OTP Authenticator")
        .with_menu(tray_menu);

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![set_ignore_blur])
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick { position, .. } => {
                let window = app.get_window("main").unwrap();
                let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as i64;
                let last_blur = LAST_BLUR.load(Ordering::SeqCst);

                if window.is_visible().unwrap() {
                    window.hide().unwrap();
                } else if now - last_blur > 400 { 
                    // Only show if it didn't *just* hide due to losing focus from this exact click
                    if let Ok(window_size) = window.outer_size() {
                        let x = position.x as i32 - (window_size.width / 2) as i32;
                        let y = position.y as i32 - window_size.height as i32 - 10;
                        let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }));
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
                    // Always reset ignore flag when window regains focus
                    IGNORE_BLUR.store(false, Ordering::SeqCst);
                } else if !IGNORE_BLUR.load(Ordering::SeqCst) {
                    LAST_BLUR.store(
                        SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as i64,
                        Ordering::SeqCst,
                    );
                    event.window().hide().unwrap();
                }
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
