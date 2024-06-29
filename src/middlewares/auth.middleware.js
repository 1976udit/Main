import {asyncHandler} from '../utils/asyncHandler.js'
import { apiError } from "../utils/apiError.js";
import jwt from 'json-web-token';
import { User } from '../models/user.model.js'


export const verifyJWT = asyncHandler(async (req,_,next) => {

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace('Bearer ' , "")
    
        // this req.header part is related to the user customised user object or header 
        // which is generally access through req.header
        // and the token is set in the form --> Authorization: Bearer <token> so we use js and replace the bearer par with " to get the token only"
    
        if(!token){
            throw new apiError(401 , "Unauthorizes Request!") 
        }
        
        // Now we decode the info from the jwt tokens 
        const decodedToken = await jwt.verify(token , process.env.ACCESS_TOKEN_SECRET) // pass token and token_secret
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user){
            throw new apiError(401,"Invalid Access Token!")
        }
        req.user = user;   // new property is appended to the req object 
        next();

    } catch (error) {
        throw new apiError(401, error?.message || "Invalid Access Token!")
    }
})