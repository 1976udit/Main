import {asyncHandler} from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudnery.js"
import {ApiResponse} from "../utils/apiResponse.js"

const registerUser = asyncHandler( async (req,res) => {
   
   // [ Logic Building ]
   // step-1  (get the user details from the front end)
   // step-2  (validate the inputs from the user)       --> Not Empty
   // step-3  (check if user already exist)             --> from username and email
   // step-5  (check from images and avatar)            --> both are required fields
   // step-6  (upload to cloudinary)
   // step-7  (create object bcz mongoDB accept objects) --> create 
   // step-8  (remove password and refresh token field from response object)
   // step-9  (check for user creation)
   // step-10 (return res)


   const {username , fullname , email , password} = req.body;
   console.log("Email : ", email);

   // validation
   // if(fullname === ""){
   //    throw new apiError(400,"fullname is required!")
   // }                                                     --> this is the basic approach 

   if(
      [fullname,password,email,username].some((field)=> field?.trim() === "")
   ){
      throw new apiError(400 , "All fielda are required!")  
   }

   if(!email.includes("@")){
      throw new apiError(400, "Enter a avalif email")
   }

   // user already exist or not
   const existance = await User.findOne({
      $or : [{username} , {email}]
   })
   // console.log(existance);
   
   if(existance) {
       throw new apiError(409,"user with this email or username already exist!") 
   }
   
   // console.log(req.files)
   const avatarLocalPath = req.files?.avatar[0]?.path;
   // console.log(avatarLocalPath);
   //  const coverImageLocalPath = req.files?.coverImage[0]?.path;  //  if this coverImage is not send than this create an undefined value 
   // console.log(coverImageLocalPath);

   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
      coverImageLocalPath = req.files.coverImage[0].url
   }


   if(!avatarLocalPath){
      throw new apiError(400 , "Avatar file is required!")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)
   
   if(!avatar){
      throw new apiError(400 , 'Avatar is required!')
   }
   
   // Now if everything is fine make an object to inject into the database
   const user = await User.create({
      fullname,
      avatar : avatar.url,
      coverImage : coverImage?.url || "",
      email,
      password,
      username : username.toLowerCase()
   })

   const createdUser = await User.findById(user._id).select("-password -refreshToken")

   if(!createdUser){
      throw new apiError(500,"Something went wrong while registration!")
   }

   return res.status(201).json(
      new ApiResponse(200,createdUser , "User registered Successfully!")  
   )

})

export {registerUser};