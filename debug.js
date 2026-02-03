// debug.js
// This script asks Google: "What models can this API Key use?"

const API_KEY = "AIzaSyDk6twTY4HNctCEU9rfiozxx7ne7gbUC8E"; 

async function checkModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.log("❌ API KEY ERROR:", data.error.message);
    } else {
      console.log("✅ SUCCESS! Here are your available models:");
      console.log("-------------------------------------------");
      // Filter to only show the "Generate Content" models we care about
      const usefulModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
      usefulModels.forEach(model => {
        console.log(model.name.replace("models/", "")); // Prints clean names like 'gemini-1.5-flash'
      });
      console.log("-------------------------------------------");
    }
  } catch (error) {
    console.log("Network Error:", error);
  }
}

checkModels();