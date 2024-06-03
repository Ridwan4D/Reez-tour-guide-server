const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json());



app.get("/", (req, res) => {
    res.send("Tour guid for tourist server is running")
  })
  
  
  app.listen(port, () => {
    console.log(`Tour guid for tourist server is running from: ${port}`);
  })