const axios = require("axios");
const apiUrl = "https://diseasepredictor-pbxb.onrender.com";

class ChatbotController {
    async predictDisease(req, res) {
        try {
          const { symptoms } = req.body;
          const response = await axios.post(`${apiUrl}/predict`, { symptoms });
          res.json(response.data);
          console.log(response.data)
        } catch (error) {
          console.error("Error:", error);
          res
            .status(500)
            .json({ message: "An error occurred while processing your request." });
        }
    }
}

module.exports = {
    ChatbotController: new ChatbotController()
};

  