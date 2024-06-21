import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}));

app.use(express.json({limit : "16kb"}))     // this line implies that this app accept json with size limit 
app.use(express.urlencoded({extended:true , limit:"16kb"}))  // it accept url encoded data with nestes objects
app.use(express.static("public"))
app.use(cookieParser())

app.get("/" , (req,res) => {
    res.send("Hello")
})

// import routes
import userRouter from './routes/user.routes.js'

app.use("/api/v1/users",userRouter)

export default app ;