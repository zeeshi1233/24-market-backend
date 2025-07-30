import mongoose from "mongoose";

export async function ConnectDb() {
    console.log(process.env.MONGODB_URI);
    
    try {
         let connection;
         if (connection?.connection?.readyState!=1) {
             connection=await mongoose.connect(process.env.MONGODB_URI);
            console.log("DB Connected")
         }
    } catch (error) {
        console.log(error);
        
    }
}