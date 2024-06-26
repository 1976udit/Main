import {asyncHandler} from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { deleteAvatarFromCloudinary, deleteCoverImageFromCloudinary, uploadOnCloudinary} from "../utils/cloudnery.js"
import {ApiResponse} from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateTokens = async (userId) => {
   try {
      const user = await User.findById(userId)
      
      const accessToken = user.generateAccessToken()
      
      const refreshToken = user.generateRefreshToken()
   
      
      user.refreshToken = refreshToken;
      await user.save({validateBeforeSave : false})   // to save data in the database

      return {accessToken,refreshToken}

   } catch (error) {
      throw new apiError(500 , error)
   }
}

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
      throw new apiError(400, "Enter a valid email")
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

const loginUser = asyncHandler(async (req,res) => {
 
   // [ logic ]
   // step-1  (get the required details from frontend) -- username/email and password
   // step-2  (validate the inputs from the user)
   // step-3  (check the existance or find the user through username/email)
   // step-4  (verify the password)
   // step-5  (generate access and refresh token)
   // step-6  (provide these tokens to user through cookies)

   const {username , password , email} = req.body;

   if(!username && !email){
      throw new apiError(400, "username or email is required!")
   }

   // finding the user 
   const user = await User.findOne({
      $or : [{username},{email}]
   })

   if(!user){
      throw new apiError(404,"user does not exist!")
   }

   // verify the password
   // if(this.password !== password){
   //    throw new apiError(400 , "Invalid password!")
   // }                                           // we can do this but we have a bcrypt method to check password

   const isPasswordValid = await user.isPasswordCorrect(password);

   if(!isPasswordValid){
      throw new apiError(401 , "Invalid Password")
   }
   
   const {accessToken , refreshToken}  = await generateTokens(user._id);
   const loggedInUser = await User.findOne(user._id).select("-password -refreshToken")
   
   // cookies
   const option = {
      httpOnly : true,  // these both httpOnly and secure makes the cookies more secure we cant update them from frontend only see
      secure : true
   }

   return res
   .status(200)
   .cookie("accessToken" , accessToken , option)
   .cookie("refreshToken" , refreshToken , option)
   .json(
      new ApiResponse(
         200,
         {
           user : loggedInUser,accessToken,refreshToken
         },
         "User logged in successfully!"
      )
   )

})

const logoutUser = asyncHandler(async (req,res) => {

   // get the user
   // clear the refresh token

   User.findByIdAndUpdate(
      req.user._id,
      {
         $set : {
            refreshToken : undefined
         }
      },
      {
         new : true
      }
   )

   const option = {
      httpOnly : true, 
      secure : true
   }
   
   return res
   .status(200)
   .clearCookie("accessToken",option)
   .clearCookie("refreshToken", option)
   .json(
      new ApiResponse(200 , {}, "User is Logged Out!")
   )

})

const refreshAccessToken = asyncHandler(async (req,res) => {
  const incomingRefreshToken =  req.cookie.refreshToken || req.body.refreshToken;
  
  if(!incomingRefreshToken){
   throw new apiError(401,"Unauthorized request!")
  }
  
  try {
   const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
 
   const user = User.findById(decodedToken?._id)
 
   if(!user){
    throw new apiError(401,"Invalid refresh token")
   }
 
   if(incomingRefreshToken !== user?.refreshToken){
    throw new apiError(401, "Refresh token is expired or used!")
   }
 
   const {accessToken , newrefreshToken} = await generateTokens(user._id)
 
   const option = {
    httpOnly : true, 
    secure : true
 }
 
 return res
 .status(200)
 .cookie("accessToken",accessToken,option)
 .cookie("refreshToken",newrefreshToken,option)
 .json(
    new ApiResponse(
       200,
       {
          accessToken,newrefreshToken
       },
       "New Tokens are Successfully Generated!"
    )
 )
  } catch (error) {
     throw new apiError(401,error?.message || "Invalid Refresh Token!")
  }

})

const changeCurrentPassword = asyncHandler(async (req,res) => {
   const {oldPassword , newPassword} = req.body;
   const user = await User.findById(req.user?._id)
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
   if(!isPasswordCorrect){
      throw new apiError(400 , "Invalid Old Password!")
   }
   user.password = newPassword;             // We have set the value here now we have to save
   user.save({validateBeforeSave : false});

   return res.status(200)
   .json(new ApiResponse(200, {}, "Password is Successfully Changed!"))
})

const getCurrentUser = asyncHandler(async (req,res) => {
   return res.status(200)
   .json(new ApiResponse(200 , req.user , "Current User Fetched Successfully!"))
})

const updateUserDetails = asyncHandler(async (req,res) => {
   const {fullname,email} = req.body
   if(!fullname || !email){
      throw new apiError(400 , "All Fields are Required!")
   }

   const user = await User.findByIdAndUpdate(req.user?._id , {
      fullname, email
      },
      { new : true }).select("-password")

 return res.status(200)
       .json(new ApiResponse(200 , user , "Account details are updated successfully!"))

})

const updateUserAvatar = asyncHandler(async (req,res) => {
   const avatarLocalPath = req.file?.path

   if(!avatarLocalPath){
       throw new apiError(400,"Avatar file is missing!")
   } 

   const avatar = await uploadOnCloudinary(avatarLocalPath)
   if(!avatar.url){
      throw new apiError(400,"Error while file uploading of Avatar!")
   }
   deleteAvatarFromCloudinary();
   const user = await User.findByIdAndUpdate(req.user?._id,
      $set = {avatar : avatar.url},
      {new:true} ).select("-password")
   
 return res.status(200)
           .json(200,user,"Avatar is successfully changed!")
})

const updateUserCoverImage = asyncHandler(async (req,res) => {
   const coverLocalPath = req.file?.path

   if(!coverLocalPath){
       throw new apiError(400,"Cover file is missing!")
   } 
   deleteCoverImageFromCloudinary()  
   const coverImage = await uploadOnCloudinary(coverLocalPath)
   if(!coverImage.url){
      throw new apiError(400,"Error while file uploading of Cover Image!")
   }

   const user = await User.findByIdAndUpdate(req.user?._id,
      $set = {coverImage : coverImage.url},
      {new:true} ).select("-password")
   
return res.status(200)
          .json(200,user,"Cover Image is successfully changed!")
})

const getUserChannelProfile = asyncHandler(async (req,res) => {
   const {username} = req.params
   if(!username?.trim()){
      throw new apiError(400,"Username is Missing!")
   }

   // Aggregation Pipline (stages of function on entire set of objects(users)) --> return arrays
   const channel = await User.aggregate([
      //stage-1
      {
         $match : {
            username : username?.toLowerCase()     // Now you have only one obj which is channel
         }
      },
      //stage-2 (no. of a channel's subscribers)
      {
         $lookup :{
            from : "subscriptions",       // see from this model
            localField : "_id",
            foreignField : "channel",
            as : "subscribers"
         }
      },
      //stage-3 (no. of channels subscribed)
      {
         $lookup : {
            from : "subscriptions",       // see from this model
            localField : "_id",
            foreignField : "subscriber",
            as : "subscribedTo"
         }
      },
      //stage-4 (adding new fields)
      {
         $addFields : {
            subscribersCount : {
               $size : "$subscribers"
            },
            channelSubscribedTo : {
               $size : "subscribedTo"
            },
            isSubscribed : {
               $cond : {
                  if : {$in : [req.user?._id, "$subscribers.subscriber"]},
                  then : true,
                  else : false
               }
            }
         }
      },
      //stage-5 (porjecting)
      {
         $project : {
            fullname : 1,         // this si a flag aggregation function
            username : 1,
            subscribersCount : 1,
            channelSubscribedTo : 1,
            isSubscribed :1,
            avatar : 1,
            coverImage :1,
            email : 1
         }
      }

   ])

   if(!channel?.length){
      throw new apiError(404 , "Channel does not exist!")
   }

   return res.status(200)
             .json(new ApiResponse(200,channel[0],"User Channel is Fatched Successfully!"))
})

const getWatchHistory = asyncHandler(async (req,res) => {
   const user =await User.aggregate([
      {
          $match :{
            _id : new mongoose.Types.ObjectId(req.user?._id)   // you can't use it(req.user?._id) directly inside the aggregation (bcz mongoose internally converts the response string into a id) 
          }
      },
      {
         $lookup : {
            from : "vedios",
            localField : "watchHistory",
            foreignField : "_id",
            as : "watchHistory",
            pipeline : [
               {
                  $lookup : {
                     from : "users",
                     localField: "owner",
                     foreignField : "_id",
                     as : "owner",
                     pipeline : [
                        {
                           $project : {
                              fullname : 1,
                              username : 1,
                              avatar : 1
                           }
                        }
                     ]
                  }
               },
               {
                  $addFields : {
                     owner : {
                        $first : "$owner"
                     }
                  }
               }
            ]
         }
      }
   ])

   return res
   .status(200)
   .json(new ApiResponse(200 , user[0].watchHistory , "Watch History Fetched Successfully!"))
})


export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateUserDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserChannelProfile,
   getWatchHistory
};