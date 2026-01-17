
import fetch from 'node-fetch';

const apiKey = "AIzaSyDrttlZvIHRQ3AJvCTwE3e1jne8Udh3-O8";
const cx = "b750d907be2b644ac";
const query = "Pizzaria em São Paulo";
const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;

async function testCustom() {
  console.log("Testing Custom Search API...");
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.error) {
       console.error("Custom Search Error:", JSON.stringify(data.error, null, 2));
    } else {
       console.log("SUCCESS! Custom Search works.");
       console.log(`Found ${data.items ? data.items.length : 0} items.`);
       if (data.items && data.items.length > 0) {
           console.log("First item:", data.items[0].title);
       }
    }
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testCustom();
