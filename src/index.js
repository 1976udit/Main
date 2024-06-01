// to instantly configure the env constants or file we use
// require('dotenv').config({path : './env'})  or we can do
import dotenv from 'dotenv';

import express from 'express';
import connectDB from "./db/db";
const app = express()

connectDB();
dotenv.config({
    path : "./env"
})










/*   This is how to connect db in index.js file

// function connectDB() {   
// }
// connectDB();                this is one way

;(async ()=> {                 // (;) this is used to ensure when it is not applied to the previous line
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)

        // check if any error in communication of express and mongo
        app.on("error", (error) => {
            console.log(error)
            throw error;
        })

        // if no error found then listen
        app.listen(process.env.PORT , ()=>{
            console.log("App is listening on the this port PORT")
        })

    } catch (error) {
        console.log(error)
        throw error;
    }                           // this is self executing iffi method
})()

// always assume DB in another continent so requires some time (so we use async)

*/
