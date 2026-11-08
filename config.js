'use strict';

/* =========================================================
   KindWorld connection for 住 (volunteer matching).
   Fill in both values to share posts between phones through
   KindWorld's Supabase database. Leave them empty and every
   post stays on this phone only (the old behaviour).
   ⚠ Use the *anon* (public) key — never the service_role key.
   ========================================================= */
const KINDWORLD = {
  url: '',      // e.g. 'https://abcdefgh.supabase.co'
  anonKey: '',  // Supabase → Project Settings → API → anon public
};
