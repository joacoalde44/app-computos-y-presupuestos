import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";

const schema = z.object({
  nombre: z.string().min(1, "Ingresá tu nombre"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type FormData = z.infer<typeof schema>;

export default function Registro() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      const r = await api.post("/auth/register", data);
      setSession(r.data.accessToken, r.data.usuario);
      toast.success("¡Cuenta creada!");
      navigate("/suscribirse");
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? "Error al registrarse");
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Crear cuenta</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
          <input {...register("nombre")} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input type="email" {...register("email")} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña</label>
          <input type="password" {...register("password")} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isSubmitting ? "Creando cuenta..." : "Registrarme"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Ya tenés cuenta? <Link to="/usuarios/iniciar-sesion" className="font-medium text-brand-600 hover:underline">Iniciá sesión</Link>
      </p>
    </div>
  );
}
