
const express = require('express');
const itemsRoute =require('./items');



const router = express.Router();
router.use('/items',itemsRoute);


module.exports = router;
