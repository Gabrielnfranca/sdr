
// import fetch from 'node-fetch'; // Not needed in Node 18+

const apiKey = "AIzaSyDrttlZvIHRQ3AJvCTwE3e1jne8Udh3-O8";
const query = "Pizzaria em São Paulo";
const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

async function test() {
  try {
    console.log("Testing Google Places API...");
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.status === 'OK') {
      console.log("SUCCESS! API Key is working.");
      console.log(`Found ${data.results.length} results.`);
    } else {
      console.error("ERROR: API returned status:", data.status);
      console.error("Error message:", data.error_message);
    }
  } catch (err) {
    console.error("Network or Script Error:", err);
  }
}

test();
