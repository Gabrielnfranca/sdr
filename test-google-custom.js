import fetch from 'node-fetch';

const apiKey = "AIzaSyBnj18WLwd7E_jWJ9vcwHf_DhpZ337tYug";
const cx = "b0ae86a409b324d31";
const query = "Preciso de um site (site:linkedin.com/posts OR site:instagram.com)";
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
           console.log("Link:", data.items[0].link);
       }
    }
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testCustom();