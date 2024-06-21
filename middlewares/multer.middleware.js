import multer from "multer";

// diskStorage method configures how files should be stored on the disk
// cb = callBack it requirs two args (error and path of destination)

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },

    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
    
  })
  
export const upload = multer({ 
    storage, 
})