const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  getAllProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  updateStock,
  updatePrice
} = require('../controllers/productController');

router.get('/', protect, getAllProducts);
router.post('/', protect, createProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);
router.post('/updateStock', protect, updateStock);
router.post('/update-price', protect, updatePrice);  

module.exports = router; 