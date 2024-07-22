import { Router } from "express";
import { postNewProduct, updateProduct } from "src/controllers/product";
import { isAuth } from "src/middlesware/auth";
import fileParser from "src/middlesware/fileParser";
import validate from "src/middlesware/validator";
import { newProductSchema } from "src/utils/validationSchema";




const productRouter = Router()

productRouter.post('/postProduct', isAuth, fileParser, validate(newProductSchema), postNewProduct)
productRouter.patch('/:id', isAuth, fileParser, validate(newProductSchema), updateProduct)

export default productRouter
