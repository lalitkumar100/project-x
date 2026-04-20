
const express = require('express');
const { searchItems, getSuggestions,getItemById } = require('../controllers/itemsController');

const router = express.Router();
router.get('/search', searchItems);
router.get('/suggestions', getSuggestions);
router.get('/details/:id',getItemById)


module.exports = router;