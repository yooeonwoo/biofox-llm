const axios = require("axios");

const BASE_URL = process.env.MEM0_ENDPOINT;
const API_KEY = process.env.MEM0_API_KEY;

if (BASE_URL && !/^https?:\/\//.test(BASE_URL)) {
  console.warn(
    "[mem0] MEM0_ENDPOINT should include protocol e.g. http://mem0:8000 – value provided:",
    BASE_URL
  );
}

const headers = API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {};

async function addMemory(userId = 0, messages = []) {
  if (!BASE_URL || !API_KEY) return; // mem0 not configured – noop
  try {
    await axios.post(
      `${BASE_URL.replace(/\/$/, "")}/memories`,
      { user_id: String(userId), messages },
      { headers }
    );
  } catch (err) {
    console.error("[mem0] addMemory error", err?.message || err);
  }
}

async function searchMemory(userId = 0, query = "", top_k = 5) {
  if (!BASE_URL || !API_KEY) return [];
  try {
    const { data } = await axios.post(
      `${BASE_URL.replace(/\/$/, "")}/search`,
      { user_id: String(userId), query, top_k },
      { headers }
    );
    return data?.matches || [];
  } catch (err) {
    console.error("[mem0] searchMemory error", err?.message || err);
    return [];
  }
}

function shouldUseMem0(user) {
  // Default true unless explicitly set to false (column enable_mem0)
  return user?.enable_mem0 !== false;
}

module.exports = { addMemory, searchMemory, shouldUseMem0 };
