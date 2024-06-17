// Promise approach
// This function is returning a new function with proper error handling by passing error to express error middleware
const asyncHandler = (requestHandler) => {
    (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err))
    }
}




// Try Catch approach

// It is a high order function
// const asyncHandler = (fn) => async(req,res,next) => {
//       try {
//             await fn(req,res,next)
//       } catch (error) {
//          res.status(error.code || 500).json({
//             success : false,
//             msg : error.msg
//          })
//       }
// }

export {asyncHandler};