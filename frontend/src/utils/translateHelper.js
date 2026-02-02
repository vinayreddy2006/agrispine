import axios from 'axios';

export const translateText = async (text, targetLang) => {
  if (!text || targetLang === 'en') return text;
  
  try {
    // Using Google's free translation API
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURI(text)}`;
    const response = await axios.get(url);
    return response.data[0][0][0]; // Return translated text
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Return original if failed
  }
};