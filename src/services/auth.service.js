const user=require('../model/user.model');
const { hashPassword, comparePassword } = require('../utils/hash');
const jwt = require('../utils/token.js');
require('dotenv').config();

const register=async({name,email,password})=>{


    if (!process.env.JWT_SECRET) {
        // need appError Handler here
       throw new Error('JWT not configured');
    }
    const existingUser= await user.findOne({email});
    if(existingUser){
        // need appError Handler here
        throw new Error('User already exists');
    }
    const hashedPassword= await hashPassword(password);
    const newUser= await user.create({name,email,password:hashedPassword});
    const token=await jwt.generateToken({id:newUser._id,email:newUser.email,role:newUser.role});
    return {user:newUser,token};
}

const login=async({email,password})=>{
    const existingUser= await user.findOne({email}).select('+password');
    if(!existingUser){
        // need appError Handler here
        throw new Error('Invalid email or password');
    }
    const isMatch= await comparePassword(password, existingUser.password);
    if(!isMatch){
        // need appError Handler here
        throw new Error('Invalid email or password');
    }
    const token=await jwt.generateToken({id:existingUser._id,email:existingUser.email,role:existingUser.role});
    return {user:existingUser,token};
}

module.exports={register, login}