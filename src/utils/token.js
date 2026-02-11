const jwt=require('jsonwebtoken')
require('dotenv').config();
const jwtSecret=process.env.JWT_SECRET

const generateToken=(payload)=>{
    const token = jwt.sign(payload , jwtSecret, { expiresIn: '1h' });
    return token;
}

const verifyToken=(token)=>{
    const decoded = jwt.verify(token, jwtSecret);
    return decoded;
}

module.exports={generateToken, verifyToken}