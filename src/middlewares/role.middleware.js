module.exports = (...roles) => {
    return (req, res, next) => {
        if (req.user ){
            if(roles.includes(req.user.role)) {
                return next();
            }else{
                return res.status(401).json({message:'unauthorized'});
            }
        }
        res.status(403).json({message:'forbidden'});
        next();
    };
};
