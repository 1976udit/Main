// to instantly configure the env constants or file, we use
// require('dotenv').config({path : './env'})  or we can do
import dotenv from "dotenv"

import connectDB from "./db/db.js";
import app from "./app.js"

dotenv.config({
    path : "./env"
})

// connectDB is a asyn function hence it returns a promise

connectDB()
.then(() => {
    app.listen(process.env.PORT || 3000 , () => {
        console.log("Server is now Live!")
    })
})
.catch((err)=>{
    console.log(err)
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
