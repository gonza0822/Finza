import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/login",
        "/register",
        "/dashboard",
        "/inicio",
        "/movimientos",
        "/cuentas",
        "/tarjetas",
        "/planificacion",
        "/metas",
        "/proyeccion",
        "/mas",
      ],
    },
  };
}
