const express = require('express');
const router = express.Router();

const {
    searchWholesalers,
    addWholesaler,
    addContactPhones,
    updatePhone,
    getWholesalerDetails,
    updateWholesalerBasicInfo,
    updateWholesalerAddress,
    getWholesalerSuggestions
} = require('../controllers/wholesalerController');
 
router.get('/search',searchWholesalers);
router.get('/suggestions',getWholesalerSuggestions);
router.post('/add',addWholesaler);
router.post('/add/phone/:id',addContactPhones);
router.get('/details/:id',getWholesalerDetails);
router.put('/details/update/:id',updateWholesalerBasicInfo);
router.put('/details/update/:id/address/:addressId',updateWholesalerAddress);

module.exports = router;