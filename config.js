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

/* Account database (account name + password), on your own Supabase project.
   1. Create a project at supabase.com.
   2. SQL Editor → paste database/accounts.sql → Run.
   3. Project Settings → API: copy the Project URL and the anon public key here.
   Leave empty and accounts stay on each phone. Never put the service_role key here. */
const DATABASE = {
  url: 'https://yafzasdmoaztmcgrkyid.supabase.co',
  anonKey: 'sb_publishable_Tzy5hhChBLjdCW9RKrmckg_7OO3GyLi', // public (publishable) key — safe in the app
};

/* Google Maps for the address box. Without a key you still get a Google map
   that follows the township and address. With a key you also get a pin you
   can drag or tap, which fills in the address for you.
   Get one at console.cloud.google.com → APIs & Services: enable
   "Maps JavaScript API" and "Geocoding API", create an API key, and under
   "Application restrictions" allow only https://student135-git.github.io/*  */
const GOOGLE_MAPS = {
  key: '',
};
