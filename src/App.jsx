import { useState, useEffect, useRef } from "react";
import * as tmImage from "@teachablemachine/image";

// ---------------------------------------------------------
// 1. Static Data & Translations
// ---------------------------------------------------------
const TRANSLATIONS = {
  en: {
    title: "The Green Alchemist",
    subtitle: "AI-Powered Plant Disease Detection",
    uploadBtn: "Upload Leaf Image",
    analyzing: "Analyzing...",
    locationBtn: "📍 Tag Farm Location",
    locSuccess: "Location Tagged!",
    diagnosis: "Diagnosis Report",
    confidence: "Confidence",
    loading: "Loading Neural Network...",
    selectImage: "Select an image to begin diagnosis",
    treatmentGuide: "Treatment & Management Guide",
    cause: "Cause:",
    management: "Action Plan:"
  },
  hi: {
    title: "द ग्रीन अल्केमिस्ट",
    subtitle: "एआई-आधारित फसल रोग पहचान",
    uploadBtn: "पत्ती की फोटो अपलोड करें",
    analyzing: "जाँच हो रही है...",
    locationBtn: "📍 खेत की लोकेशन जोड़ें",
    locSuccess: "लोकेशन सेव हो गई!",
    diagnosis: "निदान रिपोर्ट",
    confidence: "सटीकता",
    loading: "सिस्टम लोड हो रहा है...",
    selectImage: "जाँच शुरू करने के लिए फोटो चुनें",
    treatmentGuide: "उपचार और प्रबंधन गाइड",
    cause: "कारण:",
    management: "कार्य योजना:"
  },
};

// ---------------------------------------------------------
// 2. Expert System: Disease Knowledge Base
// ---------------------------------------------------------
const DISEASE_DATABASE = {
  "Potato___Early_blight": {
    en: {
      cause: "Fungus (Alternaria solani) that thrives in warm, humid weather.",
      management: "Apply copper-based fungicides. Practice crop rotation and remove infected plant debris immediately."
    },
    hi: {
      cause: "कवक (ऑल्टरनेरिया सोलानी) जो गर्म और नम मौसम में पनपता है।",
      management: "कॉपर युक्त फफूंदनाशक का छिड़काव करें। फसल चक्र अपनाएं और संक्रमित पौधों को तुरंत खेत से हटा दें।"
    }
  },
  "Potato___Late_blight": {
    en: {
      cause: "Water mold (Phytophthora infestans) spreading rapidly in cool, wet conditions.",
      management: "Use systemic fungicides like Mancozeb. Destroy infected plants and ensure proper field drainage."
    },
    hi: {
      cause: "जल कवक (फाइटोफ्थोरा इन्फेस्टैन्स) जो ठंडे और गीले मौसम में तेजी से फैलता है।",
      management: "मैनकोजेब जैसे प्रणालीगत फफूंदनाशक का उपयोग करें। संक्रमित पौधों को नष्ट करें और जल निकासी ठीक करें।"
    }
  },
  "Tomato___Early_blight": {
    en: {
      cause: "Fungus (Alternaria solani) starting from older, lower leaves.",
      management: "Prune lower leaves to increase airflow. Apply appropriate fungicides and avoid overhead watering."
    },
    hi: {
      cause: "कवक (ऑल्टरनेरिया सोलानी) जो पुरानी और निचली पत्तियों से शुरू होता है।",
      management: "हवा के प्रवाह के लिए निचली पत्तियों की छंटाई करें। फफूंदनाशक डालें और ऊपर से पानी देने से बचें।"
    }
  },
  "Tomato___Late_blight": {
    en: {
      cause: "Water mold (Phytophthora infestans) causing rapid crop destruction.",
      management: "Apply preventive fungicides. Remove and burn infected crops. Do not compost infected plants."
    },
    hi: {
      cause: "जल कवक (फाइटोफ्थोरा इन्फेस्टैन्स) जो फसल को तेजी से नष्ट करता है।",
      management: "निवारक फफूंदनाशक का प्रयोग करें। संक्रमित फसलों को उखाड़ कर जला दें। इनका खाद न बनाएं।"
    }
  }
};

function App() {
  const [model, setModel] = useState(null);
  const [imageURL, setImageURL] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState("en");
  const [location, setLocation] = useState(null);
  const imageRef = useRef();

  // 🔴 PASTE YOUR TEACHABLE MACHINE LINK HERE (Keep the trailing slash /)
  const MODEL_URL = "https://teachablemachine.withgoogle.com/models/tRO4ULQSbF/";

  useEffect(() => {
    const loadModel = async () => {
      try {
        const modelURL = MODEL_URL + "model.json";
        const metadataURL = MODEL_URL + "metadata.json";
        const loadedModel = await tmImage.load(modelURL, metadataURL);
        setModel(loadedModel);
        setLoading(false);
      } catch (error) {
        console.error("Error loading model:", error);
      }
    };
    loadModel();
  }, []);

  const handleImageUpload = (event) => {
    const { files } = event.target;
    if (files.length > 0) {
      const url = URL.createObjectURL(files[0]);
      setImageURL(url);
      setPredictions([]);
    }
  };

  const predict = async () => {
    if (model && imageRef.current) {
      const prediction = await model.predict(imageRef.current);
      prediction.sort((a, b) => b.probability - a.probability);
      setPredictions(prediction);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
      });
    } else {
      alert("Geolocation not supported");
    }
  };

  const getThemeColors = (className) => {
    const text = className.toLowerCase();
    if (text.includes("healthy")) return { bg: "bg-green-50", border: "border-green-500", text: "text-green-700", bar: "bg-green-500", lightBg: "bg-green-200" };
    if (text.includes("noise") || text.includes("background")) return { bg: "bg-gray-50", border: "border-gray-500", text: "text-gray-700", bar: "bg-gray-500", lightBg: "bg-gray-200" };
    return { bg: "bg-red-50", border: "border-red-500", text: "text-red-700", bar: "bg-red-500", lightBg: "bg-red-200" };
  };

  const formatClassName = (className) => {
    return className.replace(/___|_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const t = TRANSLATIONS[lang];

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center py-10 px-4 font-sans">
      <header className="w-full max-w-md text-center mb-8">
        <div className="flex justify-end mb-4">
          <button onClick={() => setLang(lang === "en" ? "hi" : "en")} className="text-xs font-bold bg-white border border-green-200 text-green-700 px-3 py-1 rounded-full hover:bg-green-100 transition shadow-sm cursor-pointer">
            {lang === "en" ? "🇮🇳 हिन्दी में देखें" : "🇬🇧 Switch to English"}
          </button>
        </div>
        <h1 className="text-3xl font-extrabold text-green-800 mb-2">{t.title} 🌿</h1>
        <p className="text-green-600 font-medium">{t.subtitle}</p>
      </header>

      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-green-100">
        {loading ? (
          <div className="p-10 text-center text-gray-500 animate-pulse"><p>{t.loading}</p></div>
        ) : (
          <div className="p-6">
            <div className="mb-6">
              <label className="block w-full cursor-pointer bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg text-center transition shadow-md">
                📷 {t.uploadBtn}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>

            <div className="flex justify-center bg-gray-50 rounded-lg min-h-[200px] items-center border-2 border-dashed border-gray-200 mb-6 relative overflow-hidden">
              {imageURL ? <img src={imageURL} alt="Preview" ref={imageRef} onLoad={predict} className="w-full h-64 object-cover" /> : <p className="text-gray-400 text-sm">{t.selectImage}</p>}
            </div>

            {predictions.length > 0 && (() => {
              const topPred = predictions[0];
              const theme = getThemeColors(topPred.className);
              
              // Check if it is a disease and if we have info for it
              const isDisease = !topPred.className.toLowerCase().includes("healthy") && !topPred.className.toLowerCase().includes("noise");
              const diseaseInfo = DISEASE_DATABASE[topPred.className];
              
              return (
                <div className="animate-fade-in-up">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">🔍 {t.diagnosis}</h3>
                  
                  <div className={`${theme.bg} border-l-4 ${theme.border} p-4 rounded mb-4 transition-colors duration-500`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`${theme.text} font-bold text-lg`}>{formatClassName(topPred.className)}</span>
                      <span className={`${theme.lightBg} ${theme.text} text-xs font-bold px-2 py-1 rounded-full`}>{(topPred.probability * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div className={`${theme.bar} h-2.5 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${topPred.probability * 100}%` }}></div>
                    </div>
                  </div>

                  {/* NEW EXPERT SYSTEM UI */}
                  {isDisease && diseaseInfo && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 shadow-sm">
                      <h4 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                        📋 {t.treatmentGuide}
                      </h4>
                      <div className="text-sm text-orange-900 space-y-3">
                        <p><strong className="text-orange-950">{t.cause}</strong> {diseaseInfo[lang].cause}</p>
                        <p><strong className="text-orange-950">{t.management}</strong> {diseaseInfo[lang].management}</p>
                      </div>
                    </div>
                  )}

                  {!location ? (
                    <button onClick={getLocation} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex justify-center items-center gap-2 shadow-sm cursor-pointer">
                      {t.locationBtn}
                    </button>
                  ) : (
                    <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-center border border-blue-200">
                      <p className="font-bold">✅ {t.locSuccess}</p>
                      <p className="text-xs mt-1">Lat: {location.lat.toFixed(4)} | Lon: {location.lon.toFixed(4)}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <footer className="mt-10 text-center text-gray-400 text-xs">
        <p>Project by Maheshwar Verma & Amritanshu Kumar</p>
        <p>2026</p>
      </footer>
    </div>
  );
}

export default App;