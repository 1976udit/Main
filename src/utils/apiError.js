// This is used to standerdize the format of error
// here we are overwritting the Error class to customize our own error format

class apiError extends Error {
    constructor(statusCode, 
        message = "Something went wrong",
        errors = [],
        stack = ""
 ){
       super(message);
       this.statusCode = statusCode;
       this.data = null;
       this.message = message;
       this.success = false;
       this.errors = errors;

       if(stack){
        this.stack = stack;
       }else{
        Error.captureStackTrace(this,this.constructor)
       }
    }
}

export {apiError};