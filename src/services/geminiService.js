import axios from 'axios';

const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:8000") + "/api";

export const sendMessageToGemini = async (message) => {
    try {
        const response = await axios.post(`${API_URL}/chat`, {
            message: message,
            history: []
        });
        return response.data.reply;
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        return "I'm having trouble connecting to the kitchen server. Please try again!";
    }
};