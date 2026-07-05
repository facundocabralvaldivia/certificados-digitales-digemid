/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        lato: ['Lato', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Familia institucional del módulo CERTIFICADOS (ver INTEGRACION.md).
        // Registrada como hermana de dicer-teal-* / dicer-blue-* del proyecto real.
        'dicer-cert': {
          primary: '#0F4164', // fondos principales, headers
          secondary: '#385C91', // botones secundarios, bordes, acentos
          teal: '#5AA096', // CTAs principales, badges activos
          mint: '#AAD2D2', // fondos de cards, hover states
          green: '#79ab3f', // estado HABILITADO, verificación positiva
          danger: '#C0392B', // estado NO HABILITADO / alterado (rojo institucional)
        },
      },
    },
  },
  plugins: [],
};
