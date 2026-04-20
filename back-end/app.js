
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const app = express();

const admin = require('./routes/admin.js');

app.use(cors());
app.use(express.json());
app.use('/v1/api/admin', admin);

app.get('/',async (req,res) => {
    res.send('hello it there at 5000');
})
// Test route



module.exports = app;