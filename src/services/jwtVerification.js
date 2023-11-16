import jwt from 'jsonwebtoken';

export function verifyJwt(req){
    let tokenVerified = false
    let token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
    if (token.startsWith('Bearer ')) {
      // Remove Bearer from string
      token = token.slice(7, token.length);
    }
    jwt.verify(token, 'mySuperSecrett', function(err, decoded){
        if(err){
            console.log(err)
        }
        else{
            tokenVerified = true
        }
    })
    return tokenVerified
}
