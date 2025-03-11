const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');  // Import transaction routes
const budgetRoutes = require('./routes/budgetRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const goalRoutes = require('./routes/goalRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const systemSettingsRoutes = require("./routes/settingRoutes");




dotenv.config(); // Load environment variables

const app = express();
app.use(express.json());

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI) // ✅ Removed deprecated options
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

 app.use('/api/users', userRoutes);
 app.use('/api/transactions', transactionRoutes);
 app.use('/api/budget', budgetRoutes);
 app.use('/api/reports', reportRoutes);
 app.use('/api/notifications', notificationRoutes); 
 app.use('/api/goals', goalRoutes);
 app.use('/api', dashboardRoutes);
 app.use("/api/settings", systemSettingsRoutes);
 


// Sample Schema
const TestSchema = new mongoose.Schema({ name: String });
const TestModel = mongoose.model("Test", TestSchema);

// Route to insert data
app.post("/add", async (req, res) => {
  try {
    console.log("Received request:", req.body); // Debugging log

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "❌ Name is required" });
    }

    const testDoc = new TestModel({ name });
    await testDoc.save();

    res.status(201).json({ message: "✅ Data inserted successfully!", data: testDoc });
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).json({ error: "❌ Error inserting data", details: error.message });
  }
});
// Route to retrieve data
app.get("/get", async (req, res) => {
  try {
    const data = await TestModel.find();
    res.json(data);
  } catch (err) {
    res.status(500).send("❌ Error retrieving data: " + err.message);
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

