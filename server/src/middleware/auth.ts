import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { prisma } from "../lib/prisma";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRol?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return res.status(401).json({ error: "No autenticado" });
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.userRol = payload.rol;
    next();
  } catch {
    return res.status(401).json({ error: "Token invalido o expirado" });
  }
}

export async function requireSubscription(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) return res.status(401).json({ error: "No autenticado" });
  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: req.userId } });
    if (!usuario) return res.status(401).json({ error: "No autenticado" });
    const activa = usuario.rol === "admin" || (usuario.subscriptionEnd && usuario.subscriptionEnd > new Date());
    if (!activa) {
      return res.status(403).json({ error: "Requiere suscripcion activa", redirect: "/suscribirse" });
    }
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.userRol !== "admin") return res.status(403).json({ error: "Requiere rol admin" });
  next();
}
