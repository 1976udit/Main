import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "json-web-token"

const userSchema = new Schema({
    username : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true      // to unables the searching ability of this field
    },
    email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true
    },
    fullname : {
        type : String,
        required : true,
        trim : true,
        index : true   
    },
    avatar : {
        type : String,   // cloudinary url
        required : true
    },
    coverImage : {
        type : String
    },
    watchHistory : {
        type : Schema.Types.ObjectId,
        ref : "Video"
    },
    password : {
        type : String,
        required : [true, "Password is Required!"]
    },
    refreshToken : {
        type : String,
    }
},{timestamps:true})

// .pre is a middleware(hook) which execute just after any mentioned event() it takes an callback but not arrow function
// bcz arrow function dont not have the defination of this keyword which is required here
userSchema.pre("save", async function (next){
    if(!this.isModified("password")) return next();
    this.password =await bcrypt.hash(this.password,10)    // this take 2 args (field and hash rounds)
    next();
})

// Custome Methods we can write in userSchema usinf bcrypt
userSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password, this.password)   // it take two passwords new and saved in database (bool function)
}

userSchema.methods.generateAccessToken = function(){
    jwt.sign(
        {                                             // payload (data which is encoded)
            _id : this._id,
            email : this.email,
            username : this.username,
            fullname : this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    jwt.sign(
        {                                             // payload (data which is encoded)
            _id : this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model("User", userSchema)