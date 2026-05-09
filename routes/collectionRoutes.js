const router = require('express').Router();
const {
  getCollections, getCollection, createCollection, updateCollection,
  deleteCollection, addProductToCollection, removeProductFromCollection, getAllCollectionsAdmin,
} = require('../controllers/collectionController');
const { protect, admin } = require('../middleware/auth');

router.get('/', getCollections);
router.get('/admin/all', protect, admin, getAllCollectionsAdmin);
router.get('/:slug', getCollection);
router.post('/', protect, admin, createCollection);
router.put('/:id', protect, admin, updateCollection);
router.delete('/:id', protect, admin, deleteCollection);
router.post('/:id/products', protect, admin, addProductToCollection);
router.delete('/:id/products/:productId', protect, admin, removeProductFromCollection);

module.exports = router;
