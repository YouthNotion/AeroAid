import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2026-11-01",
  devtools: { enabled: false },
  modules: ["@nuxtjs/supabase"],
  css: ["~/assets/css/main.css"],
  // vue-router 5 reads Vue's compile-time flags; bundle it so they get replaced
  // (left external, the server crashes with "__VUE_OPTIONS_API__ is not defined").
  // ssr.noExternal covers `nuxt dev`, nitro.externals covers the production build.
  vite: { plugins: [tailwindcss()], ssr: { noExternal: ["vue-router"] } },
  nitro: { externals: { inline: ["vue-router"] } },

  supabase: {
    types: "~/types/database.types.ts",
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      // Only these routes require a session; everything else is public.
      include: [
        "/profile",
        "/profile/*",
        "/requests",
        "/invitations",
        "/history",
        "/account",
      ],
      saveRedirectToCookie: true,
    },
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: true,
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: "en-GB" },
      title: "AeroAid",
      titleTemplate: "%s · AeroAid",
      meta: [
        {
          name: "description",
          content:
            "Blood donor network for the aviation community of Bangladesh.",
        },
        { name: "theme-color", content: "#000000" },
      ],
      link: [
        { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
        { rel: "icon", href: "/brand/logo-mark.svg", type: "image/svg+xml" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      ],
    },
  },

  routeRules: {
    "/**": {
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      },
    },
  },
});
