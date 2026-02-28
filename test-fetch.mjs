import fetch from 'node-fetch';

const url = 'https://nmyeipnqphxhikjynyvt.supabase.co/rest/v1/';

console.log("Testing node-fetch to:", url);

async function run() {
  try {
    const res = await fetch(url, {
      method: 'GET',
    });
    console.log("Fetch Status:", res.status);
  } catch (err) {
    console.error("Fetch Error:", err.message);
  }
}

run();
