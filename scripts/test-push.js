import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import dotenv from "dotenv";
import path from "path";

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; 
// Note: Client-side anon key can mostly READ. 
// If RLS prevents reading other's tokens, we might need SERVICE_ROLE_KEY or just test for CURRENT user if we login?
// Ideally for a backend test script, the user should provide SERVICE_ROLE_KEY or VAPID_PRIVATE_KEY.
// The user has VAPID_PRIVATE_KEY from output. We will ask them to hardcode it or use env.

// For this test script, we need:
// 1. VAPID_PUBLIC_KEY (from .env)
// 2. VAPID_PRIVATE_KEY (User needs to input this or set in .env.local)
// 3. Target User ID (optional, or send to all)

const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY;
const vapidPrivateKey = "YOUR_PRIVATE_KEY_HERE"; // User must replace this!
const vapidSubject = "mailto:test@test.com";

if (!vapidPublicKey || vapidPrivateKey === "YOUR_PRIVATE_KEY_HERE") {
  console.error("❌ Please set VAPID_PUBLIC_KEY in .env and replace 'YOUR_PRIVATE_KEY_HERE' in this script.");
  process.exit(1);
}

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPush() {
  console.log("🔍 Fetching tokens...");
  
  // NOTE: With RLS, ANON key might NOT be able to read all tokens.
  // This test script is best run with a SERVICE_ROLE_KEY if possible,
  // OR the user logs in via script (complicated).
  // FOR NOW: We assume RLS allows reading own token if we had a session, 
  // but here we are a script.
  // 
  // WORKAROUND: Ask user to paste their "Endpoint" directly for a pure connectivity test?
  // OR ask user to provide SERVICE_ROLE_KEY.
  
  // Let's try to just use VAPID sendNotification if we have a subscription object string.
  
  console.log("⚠️  For this test to work, we need a valid PushSubscription JSON.");
  console.log("👉 Go to your browser > DevTools > Application > Local Storage > finding the token might be hard.");
  console.log("👉 Easier: Did you enable notifications? If so, we will try to fetch ALL tokens (if RLS allows) or fail.");

  const { data: tokens, error } = await supabase
    .from('notification_tokens')
    .select('token');
    
  if (error) {
    console.error("Error fetching tokens:", error.message);
    console.error("💡 If this is an RLS error, it's expected because we are using ANON key without login.");
    console.error("   To test properly, please use `SUPABASE_SERVICE_ROLE_KEY` instead of ANON KEY in this script,");
    console.error("   OR copy your PushSubscription JSON manually.");
    return;
  }

  if (!tokens || tokens.length === 0) {
    console.log("No tokens found in DB.");
    return;
  }

  console.log(`Found ${tokens.length} tokens. Sending test push...`);

  tokens.forEach(async (t, idx) => {
    try {
      await webpush.sendNotification(t.token, JSON.stringify({
        title: "Test Notification 🔔",
        body: "Success! Your push notification setup is working.",
        url: "/"
      }));
      console.log(`✅ Sent to device ${idx + 1}`);
    } catch (e) {
      console.error(`❌ Failed to send to device ${idx + 1}:`, e);
    }
  });
}

testPush();
