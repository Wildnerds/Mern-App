import { UploadApiResponse } from "cloudinary";
import { RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import cloudUploader from "src/cloud";
import ProductModel from "src/models/product";
import { sendErrorRes } from "src/utils/helper";




const uploadImage = async (filePath: string): Promise<UploadApiResponse> => {
   
        const response = await cloudUploader.upload(filePath, {
            width: 1200,
            height: 720,
            crop: 'fill'
        });
        return response;
    
  }

export const postNewProduct: RequestHandler = async (req , res ) => {
    
    // User must be authenticated
    // User can upload images as well
    // Validate incoming data
    // Create Product
    // Validate and upload file (or files) - note (restrict image qty)
    // And send the response back

    const {name, price, category, description, purchaseDate} = req.body
    const newProduct  = new ProductModel({
        owner: req.user.id,
        name,
        price,
        category, 
        description, 
        purchaseDate,
        
      

        })

        

    const {images} = req.files

    const isMultipleImages = Array.isArray(images)

    if(isMultipleImages && images.length > 5) {
        return sendErrorRes(res, "Please images exceeds limit of 5", 422);
    }

    let invalidFileType = false;

    // if this is the case, we have multiple images
    if(isMultipleImages){
        for(let img of images){
            if(!img.mimetype?.startsWith('image')){
                invalidFileType = true;
                break;
            }
    } 
}   
    else{
        if(images){
            if(!images.mimetype?.startsWith('image')){
                invalidFileType = true;
                
            }
        }
    }
    if(invalidFileType)
        return sendErrorRes(res, "Invalid file type, file must be image type", 422);

    //FILE UPLOAD

    if(isMultipleImages){
       const uploadPromise =  images.map((file) => uploadImage(file.filepath));

       // wait for all uploads to complete
       const uploadResults = await Promise.all(uploadPromise);
       console.log(uploadResults);
        
       // Add the image URLs and pubic ids to the product's images
       newProduct.images = uploadResults.map(({secure_url, public_id}) =>{
        return {url:secure_url, id: public_id}
        
       })
       newProduct.thumbnail = newProduct.images[0].url

    } else {
        if(images){
            const {secure_url, public_id} = await uploadImage( images.filepath);
            newProduct.images = [{url: secure_url, id: public_id}]
            newProduct.thumbnail = secure_url
        }
    }
    

    await newProduct.save()
    res.status(201).json({message: "New product added"})
   
};

export const updateProduct: RequestHandler = async (req , res ) => {
    
    // User must be authenticated
    // User can upload images as well
    // Validate incoming data
    // Update normal properties (if the product is being updated by the same user)
    // upload and update images (restrict image quantity)
    // Send response back


   const {name, price, category, description, purchaseDate, thumbnail} = req.body
   const productID = req.params.id
   
   if(!isValidObjectId(productID)) return sendErrorRes(res, "Invalid product Id!", 422)

   const product = await ProductModel.findOneAndUpdate({_id: productID, owner: req.user.id}, {
    name, 
    price, 
    category, 
    description, 
    purchaseDate,
    
   },
   {
    new: true
    })
   if(!product) return sendErrorRes(res, "Product not found!", 404)

   if(typeof thumbnail === "string") product.thumbnail = thumbnail


    const {images} = req.files
    const isMultipleImages = Array.isArray(images)

    if(isMultipleImages){
        if(product.images.length + images.length > 5)
            return sendErrorRes(res, "Please images exceeds limit of 5", 422);
    
    }


    let invalidFileType = false;

    // if this is the case, we have multiple images
    if(isMultipleImages){
        for(let img of images){
            if(!img.mimetype?.startsWith('image')){
                invalidFileType = true;
                break;
            }
    } 
}   
    else{
        if(images){
            if(!images.mimetype?.startsWith('image')){
                invalidFileType = true;
                
            }
        }
    }
    if(invalidFileType)
        return sendErrorRes(res, "Invalid file type, file must be image type", 422);

    //FILE UPLOAD

    if(isMultipleImages){
       const uploadPromise =  images.map((file) => uploadImage(file.filepath));

       // wait for all uploads to complete
       const uploadResults = await Promise.all(uploadPromise);
       console.log(uploadResults);
        
       // Add the image URLs and pubic ids to the product's images
        const newImages = uploadResults.map(({secure_url, public_id}) =>{
        return {url:secure_url, id: public_id}
        
       });

       product.images.push(...newImages);

    } else {
        if(images){
            const {secure_url, public_id} = await uploadImage(images.filepath);

            product.images.push({url: secure_url, id: public_id})
        }
    }
    

    await product.save()
    res.status(201).json({message: "Product Updated successfully"})
   
};


