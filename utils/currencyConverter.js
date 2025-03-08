require("dotenv").config(); // Load environment variables
const axios = require("axios");

const API_KEY = process.env.EXCHANGE_RATE_API_KEY; // Load API key from .env

const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  try {
    if (!API_KEY) {
      throw new Error("Missing API key. Please configure EXCHANGE_RATE_API_KEY in the .env file.");
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error("Invalid amount. Please enter a positive number.");
    }

    if (!fromCurrency || !toCurrency) {
      throw new Error("Missing currency codes. Please provide valid 'from' and 'to' currencies.");
    }

    // Fetch exchange rates dynamically for the base currency
    const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${fromCurrency}`;
    console.log(`Fetching exchange rates from: ${url}`); // Debugging log

    const response = await axios.get(url);

    if (response.data.result !== "success") {
      throw new Error(`API Error: ${response.data["error-type"] || "Failed to fetch exchange rates."}`);
    }

    const rates = response.data.conversion_rates;
    console.log("Rates received:", rates); // Debugging log

    if (!rates[toCurrency]) {
      throw new Error(`Exchange rate for ${toCurrency} not found.`);
    }

    // Convert the amount
    const convertedAmount = amount * rates[toCurrency];
    console.log(`Converted Amount: ${convertedAmount}`); // Debugging log

    return Number(convertedAmount.toFixed(2));
  } catch (error) {
    console.error("Currency conversion error:", error.message);
    return null;
  }
};

module.exports = { convertCurrency };
