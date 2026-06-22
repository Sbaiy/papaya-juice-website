// === Papaya Kiosk · sw-register.js ===
// Enregistrement du Service Worker (extrait, بلا تغيير)

// ── Service Worker — enregistrement + mise à jour auto ──
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(reg => {
        // Vérifier les mises à jour du SW toutes les 10 min
        setInterval(() => reg.update(), 10 * 60 * 1000);
    }).catch(err => console.warn('SW registration failed:', err));
}
