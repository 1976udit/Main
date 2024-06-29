import { v2 as cloudinary } from "cloudinary";
import fs from 'fs';  
import { User } from "../models/user.model";
import {asyncHandler} from "./asyncHandler.js"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;

        // upload the file 
        const response = await cloudinary.uploader.upload(localFilePath , {
            resource_type : "auto"
        })
 
        // file has been successfully uploaded
        // console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath)   // remove the locallay stored file as the upload operation got failed
        return null;
    }
}

const deleteAvatarFromCloudinary = asyncHandler(async ()=>{
    const user = await User.findById(req.user?._id)
    if(!user){
       throw new apiError(500,"Error in deleting filr from Cloudinary!")
    }
    const avatarString = user.avatar;
    const avatarArray = avatarString.split('/')
    const ImageString = avatarArray[avatarArray.length()-1]
    const ImageName = ImageString.split('.')[0]
 
    cloudinary.uploader.destroy(ImageName)

    return res.sataus(200)
 })

 const deleteCoverImageFromCloudinary = asyncHandler(async ()=>{
    const user = await User.findById(req.user?._id)
    if(!user){
       throw new apiError(500,"Error in deleting filr from Cloudinary!")
    }
    const coverString = user.coverImage;
    const coverArray = coverString.split('/')
    const ImageString = coverArray[coverArray.length()-1]
    const ImageName = ImageString.split('.')[0]
 
    cloudinary.uploader.destroy(ImageName)

    return res.sataus(200)
 })

export {
       uploadOnCloudinary,
       deleteAvatarFromCloudinary,
       deleteCoverImageFromCloudinary
    };