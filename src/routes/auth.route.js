const router=require('express').Router();
const { register, login }=require('../controllers/auth.controller.js');
const authvalidator=require('../validators/auth.validator.js');
const valid=require('../middlewares/validation.middleware.js');


router.post('/register',authvalidator.registerValidator,valid, register);
router.post('/login',authvalidator.loginValidator,valid, login);


module.exports=router;