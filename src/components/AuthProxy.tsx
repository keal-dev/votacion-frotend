"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function AuthProxy({
  children,
  requireAuth = true,
}: {
  children: React.ReactNode;
  requireAuth?: boolean;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = Cookies.get("token");

    if (requireAuth) {
      // Si requiere estar logueado y no hay token, lo mandamos al login
      if (!token) {
        router.push("/login");
      } else {
        setAuthorized(true);
      }
    } else {
      // Si NO requiere estar logueado (como la vista de login) y HAY token, lo mandamos al home
      if (token) {
        router.push("/");
      } else {
        setAuthorized(true);
      }
    }
  }, [router, requireAuth]);

  // Mostrar un div vacío o loader mientras decide si redirigir o mostrar
  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
