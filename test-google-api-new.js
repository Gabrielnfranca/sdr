
const apiKey = "AIzaSyDrttlZvIHRQ3AJvCTwE3e1jne8Udh3-O8";
const url = "https://places.googleapis.com/v1/places:searchText";

async function testNewApi() {
  console.log("Testing Google Places API (NEW Version)...");
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.websiteUri"
      },
      body: JSON.stringify({
        textQuery: "Pizzaria em São Paulo"
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log("SUCCESS! The NEW API is working.");
      console.log(`Found ${data.places ? data.places.length : 0} results.`);
      if (data.places && data.places.length > 0) {
        console.log("First result:", data.places[0].displayName.text);
      }
    } else {
      console.error("ERROR: API returned status:", response.status);
      console.error("Error details:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Network or Script Error:", err);
  }
}

testNewApi();
