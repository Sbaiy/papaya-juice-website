/**
 * ╔══════════════════════════════════════════╗
 * ║   Papaya Juice — Supabase Config         ║
 * ║   ملف مشترك — لا تكرر هاد المعلومات    ║
 * ╚══════════════════════════════════════════╝
 *
 * Usage (dans chaque page HTML) :
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="/supabase.js"></script>   ← ou chemin relatif selon la page
 *   <!-- puis utiliser window._db -->
 */

(function () {
  const SUPABASE_URL = "https://rlwshuurruvtnqwgbjkl.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsd3NodXVycnV2dG5xd2diamtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNzkzMjAsImV4cCI6MjA5NDg1NTMyMH0.PV4EpbydpLTS36OVyaqy9qANWRec7B9F-emlaS0qqRw";

  if (!window.supabase) {
    console.error("❌ supabase-js غير محمل — أضف السكريبت CDN قبل supabase.js");
    return;
  }

  window._db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log("🍹 Supabase client initialisé");
})();
