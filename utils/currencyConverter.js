const axios = require("axios");  // Use require instead of import
const API_KEY = "f0c2f100eeff2a348e2118fc";
const BASE_CURRENCY = "LKR"; 

const getExchangeRate = async (currency) => {
  try {
    const response = await axios.get(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${BASE_CURRENCY}`);
    return response.data.conversion_rates[currency] || 1; 
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return 1;
  }
};

module.exports = { getExchangeRate }; // Export using module.exports
