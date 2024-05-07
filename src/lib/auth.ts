import jwt from "jsonwebtoken";

export function generateJWT(payload: any) {
  const SECRET_KEY = process.env.SECRET_KEY || "s3cr3tk3y";

  return jwt.sign(payload, SECRET_KEY);
}

export function verifyJWT(token: string) {
  const SECRET_KEY = process.env.SECRET_KEY || "s3cr3tk3y";

  if (!token) {
    return null;
  }
  return jwt.verify(token, SECRET_KEY);
}
