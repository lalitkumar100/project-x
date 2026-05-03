
const express = require('express');
const itemsRoute =require('./items');
const contactRoute =require('./contact');
const purchaseRoute = require('./purchase');
const customerRoute = require('./customer');
const salesRoute = require('./sales.js');

const router = express.Router();
router.use('/items',itemsRoute);
router.use('/contact',contactRoute);
router.use('/purchase', purchaseRoute);
router.use('/customer', customerRoute);
router.use('/sales', salesRoute);
module.exports = router;
