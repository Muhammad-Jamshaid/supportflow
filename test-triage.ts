import { triageTicket } from "./lib/ai";

async function runTest() {
  console.log("=== Testing AI Triage with Broken/Missing Key ===");
  
  // We don't have a real ticket ID in DB, but triageTicket won't crash even if the update fails,
  // or it will fail at the API call stage before even hitting the DB if the key is broken.
  
  // We'll intentionally use a bad key by overriding the env var
  process.env.GROQ_API_KEY = "gsk_intentionally_broken_key_for_testing_fallback_12345";

  console.log("Starting triage... (this should not crash the app)");
  
  const startTime = Date.now();
  await triageTicket("dummy_ticket_id", "Test Subject", "Test description that won't actually be processed");
  const endTime = Date.now();
  
  console.log(`\nTriage completed (gracefully swallowed error) in ${endTime - startTime}ms.`);
  console.log("Success! Fallback works.");
}

runTest();
