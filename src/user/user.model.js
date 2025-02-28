
import mongoose, {Schema, model} from 'mongoose';

const userSchema = Schema(
  {
    name: {
        type: String,
        maxLength: [25, `Can't be overcome 25 characters`],
        required: [true, 'Name is required']
    },
    surname: {
        type: String,
        maxLength: [25, `Ca't over come 25 characters`],
        required: [true, 'Surname is required']
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        lowercase: true,
        maxLength: [25, `Ca't over come 25 characters`]
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'Email is reuired'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minLength: [8, 'Password must be 8 characters'],
        maxLength: [100, `Can't be overcome 16 characters`],
    },
    profilePicture: {
        type: String
    },
    phone: {
        type: String,
        required: [true, 'Phone is required'],
        maxLength: [13, `Can't be overcome 8 numbers`],
        minLength: [8, `Phone must be 8 numbers`]
    },
    role:{
        type: String,
        required: [false, 'Role is required'],
        uppercase: true,
        enum: ['ADMIN', 'USER'],
        default: 'USER'
    },
    status: {
        type: Boolean,
        default: true
    }
  }
);


export default model ("User",userSchema);
