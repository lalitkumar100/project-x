
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const pool = require('./config/db');
const app = express();




const admin = require('./routes/admin.js');
const sales = require('./routes/sales.js');
const tcg   = require('./routes/tcg.js');
const predictionRoutes = require('./routes/prediction');
const setupRoutes = require('./routes/setup');
const errorHandler = require('./middlewares/errorHandler');
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use('/v1/api/admin', admin);
app.use('/v1/api/sales', sales);
app.use('/v1/api/tcg',   tcg);
app.use('/v1/api/prediction', predictionRoutes);
app.use('/v1/api/setup', setupRoutes);


app.get('/',async (req,res) => {
    res.send('hello it there at 6000');
})
// Test route


app.use(errorHandler);

module.exports = app;
