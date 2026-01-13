import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
    const header = req.headers.authorization;
    if(!header ) return res.status(401).json({ message: "No token, authorization denied" });

    try {
        const token = header.split(" ")[1];
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token is not valid" }); 
    }
    };

    export const allowRoles = (...roles) => (req, res, next) =>    {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied: insufficient permissions" });
    }
    next();
};