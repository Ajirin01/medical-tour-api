const express = require("express");
const router = express.Router();
const axios = require("axios");

// const apiUrl = "https://diseaseprediction-rnbf.onrender.com/ask";
// const apiUrl = "https://aiconsultdemo.onrender.com/predict_disease";
const apiUrl = "https://diseasepredictionsystem-3lfy.onrender.com/ask";


router.post("/predict_disease", async (req, res) => {
  console.log("I'm Here!");
  try {
    const { question } = req.body;
    const response = await axios.post(apiUrl, { question });
    res.json(response.data);
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: "An error occurred while processing your request." });
  }
});

module.exports = router;
