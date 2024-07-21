const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// get all products
router.get('/', async (req, res) => {
  try{ 
    const productDatra = await Product.findAll({
      include: [{model: Category, model: Tag}],
    });
    res.status(200).json(productDatra);
  }catch(err){
    res.status(500).json(err);
  }
});

// get one product
router.get('/:id', async (req, res) => {
  try{ 
    const singleProduct = await Product.findByPk(req.params.id, {
      include: [{model: Category, model: Tag}],
    });
    res.status(200).json(singleProduct);
  }catch(err){
    res.status(500).json(err);
  }
});

// create new product
router.post('/', (req, res) => {
 
  Product.create(req.body)
    .then((product) => {
      // if there's product tags, we need to create pairings to bulk create in the ProductTag model
      if (req.body.tagIds.length) {
        const productTagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(productTagIdArr);
      }
      // if no product tags are found:
      res.status(200).json(product);
    })
    .then((productTagIds) => res.status(200).json(productTagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

// update product
router.put('/:id', async (req, res) => {
  // update the product data
  Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {
      if (req.body.tagIds && req.body.tagIds.length) {
        
        ProductTag.findAll({
          where: { product_id: req.params.id }
        }).then((productTags) => {
          const productTagIds = productTags.map(({ tag_id }) => tag_id);
          const newProductTags = req.body.tagIds
          .filter((tag_id) => !productTagIds.includes(tag_id))
          .map((tag_id) => {
            return {
              product_id: req.params.id,
              tag_id,
            };
          });

            // figure out which ones to remove
          const productTagsToRemove = productTags
          .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
          .map(({ id }) => id);
                 
          return Promise.all([
            ProductTag.destroy({ where: { id: productTagsToRemove } }),
            ProductTag.bulkCreate(newProductTags),
          ]);
        });
      }

      return res.json(product);
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});

router.delete('/:id', async (req, res) => {
  try{
    const destroyProduct = await Product.destroy({
      where: {
        id: req.params.id
      }
    });
    
    if(!destroyProduct) {
      res.status(404).json({ message: 'No location found with this id!' });
      return;
    }
    res.status(200).json(destroyProduct);
  } catch(err) {
    res.status(500).json(err);
  }
});

module.exports = router;