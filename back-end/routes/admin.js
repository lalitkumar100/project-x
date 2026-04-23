
const express = require('express');
const itemsRoute =require('./items');
const contactRoute =require('./contact');


const router = express.Router();
router.use('/items',itemsRoute);
router.use('/contact',contactRoute);

module.exports = router;
