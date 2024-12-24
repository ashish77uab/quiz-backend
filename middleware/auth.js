import jwt from "jsonwebtoken";
export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWTSECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

export const isValidToken = (token) => {
  return  jwt.verify(token, process.env.JWTSECRET, (err, user) => {
    if (err) {
      return false
    }else{
      return user

    }
  });
}