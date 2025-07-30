import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /.+\@.+\..+/, 
    },
    phoneNumber: {
      type: String,
      required: true,
      match: /^\+?(\d{1,3})?(\d{10})$/, 
    },    
    profilePic:{
     type:String,
     required:true,   
    },
    password: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt timestamps to the schema
);

const User = mongoose.model('User', userSchema);

export default User;
