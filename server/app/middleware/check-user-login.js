module.exports = () =>{
    return (req, res, next) =>{
        if(!req.isAuthenticated()) return res.json({success:false , data:'user not authenticated'});
        next();
    }
}