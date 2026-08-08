import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

const REFRESH_COOKIE = "refresh_token";
const isProd = process.env.NODE_ENV === "production";

function setRefreshCookie(res: import("express").Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre: z.string().min(1),
});

router.post("/register", asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password, nombre } = parsed.data;

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) return res.status(409).json({ error: "El email ya esta registrado" });

  const hash = await bcrypt.hash(password, 10);
  const usuario = await prisma.usuario.create({
    data: { email, password: hash, nombre },
  });

  const payload = { sub: usuario.id, email: usuario.email, rol: usuario.rol };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  setRefreshCookie(res, refreshToken);

  res.status(201).json({
    accessToken,
    usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol },
  });
}));

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password } = parsed.data;

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) return res.status(401).json({ error: "Credenciales invalidas" });

  const ok = await bcrypt.compare(password, usuario.password);
  if (!ok) return res.status(401).json({ error: "Credenciales invalidas" });

  const payload = { sub: usuario.id, email: usuario.email, rol: usuario.rol };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  setRefreshCookie(res, refreshToken);

  res.json({
    accessToken,
    usuario: {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      suscripto: usuario.rol === "admin" || (!!usuario.subscriptionEnd && usuario.subscriptionEnd > new Date()),
    },
  });
}));

router.post("/logout", (_req, res) => {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  res.status(204).send();
});

router.post("/refresh", async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) return res.status(401).json({ error: "No hay refresh token" });
  try {
    const decoded = verifyRefreshToken(token);
    const usuario = await prisma.usuario.findUnique({ where: { id: decoded.sub } });
    if (!usuario) return res.status(401).json({ error: "Usuario no encontrado" });

    const payload = { sub: usuario.id, email: usuario.email, rol: usuario.rol };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: "Refresh token invalido o expirado" });
  }
});

router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const usuario = await prisma.usuario.findUnique({ where: { id: req.userId } });
  if (!usuario) return res.status(404).json({ error: "No encontrado" });
  res.json({
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    rol: usuario.rol,
    suscripto: usuario.rol === "admin" || (!!usuario.subscriptionEnd && usuario.subscriptionEnd > new Date()),
  });
}));

export default router;
