const service=require('../services/auth.service');

const register=async (req,res)=>{
    try{
        const result = await service.register(req.body);
        res.status(201).json({status:201, data:result});
    }catch(err){ 
        // need appError Handler here
        res.status(400).json({message:'here',error:err.message});
    }
}


const login=async (req,res)=>{
    try{
        const {email,password}=req.body;
        const existingUser=await service.login({email,password});
        res.status(200).json({user:existingUser});
    }catch(err){
        // need appError Handler here
        res.status(400).json({error:err.message});
    }
}

module.exports={register, login}

