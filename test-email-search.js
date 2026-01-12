
const apiKey = "AIzaSyDrttlZvIHRQ3AJvCTwE3e1jne8Udh3-O8";
const cx = "35517ff8395fc4a25";

// Test query: A known company or generic search to see if we get results
const company = "Pizzaria";
const city = "São Paulo";
const query = `"${company}" "${city}" email OR contato OR "@gmail.com" OR "@hotmail.com" -site:instagram.com/p/`;

const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;

async function testEmailSearch() {
  console.log("Testing Google Custom Search API for Emails...");
  console.log(`Query: ${query}`);
  
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      console.error("ERROR: API returned an error:");
      console.error(JSON.stringify(data.error, null, 2));
      
      if (data.error.code === 403) {
        console.log("\n--- DIAGNOSIS ---");
        console.log("Error 403 usually means 'Custom Search API' is NOT enabled in Google Cloud Console.");
        console.log("Action: Go to Google Cloud Console > APIs & Services > Enable APIs > Search 'Custom Search API' > Enable it.");
      }
      return;
    }

    if (!data.items || data.items.length === 0) {
      console.log("Success: API worked, but found no results for this query.");
    } else {
      console.log(`Success: Found ${data.items.length} results.`);
      console.log("First result snippet:", data.items[0].snippet);
    }

  } catch (err) {
    console.error("Network or Script Error:", err);
  }
}

testEmailSearch();
