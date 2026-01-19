
const SUPABASE_URL = "https://arlpfhuxbnyexqlzajfs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFybHBmaHV4Ym55ZXhxbHphamZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjc2NjcsImV4cCI6MjA4MzgwMzY2N30.tWLnmUY-SmEZfMg2UfUxLLP66lko9qSf_KSyt8HcHMQ";

async function testSearchLeads() {
  const url = `${SUPABASE_URL}/functions/v1/search-leads`;
  console.log(`Calling ${url}...`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: "Pizzaria em São Paulo",
        limit: 1
      })
    });

    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response len:", text.length);
    console.log("Response preview:", text.substring(0, 500));
    
  } catch (error) {
    console.error("Error:", error);
  }
}

testSearchLeads();
