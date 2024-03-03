import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

export function verifyJwt(req){
    let tokenVerified = false
    let token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
    if (token.startsWith('Bearer ')) {
      // Remove Bearer from string
        token = token.slice(7, token.length);
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            tokenVerified = false
        }
        else{
            tokenVerified = decoded
        }
    })
    return tokenVerified
}
