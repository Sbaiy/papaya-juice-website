/**
 * ╔══════════════════════════════════════════╗
 * ║   Papaya Juice — Supabase Config (v2)    ║
 * ║   Frontend — anon key OK ici             ║
 * ║   RLS activé → anon key = lecture seule  ║
 * ╚══════════════════════════════════════════╝
 *
 * IMPORTANT: la anon key est publique par design Supabase.
 * La protection réelle vient du RLS (rls_policies.sql).
 * Ne jamais mettre la SERVICE_ROLE key ici.
 */

(function () {
  // anon key — publique par design, protégée par RLS
  const SUPABASE_URL = "https://rlwshuurruvtnqwgbjkl.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsd3NodXVycnV2dG5xd2diamtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNzkzMjAsImV4cCI6MjA5NDg1NTMyMH0.PV4EpbydpLTS36OVyaqy9qANWRec7B9F-emlaS0qqRw";

  if (!window.supabase) {
    console.error("❌ supabase-js غير محمل — أضف السكريبت CDN قبل supabase.js");
    return;
  }

  window._db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log("🍹 Supabase client initialisé (anon — RLS actif)");
})();
