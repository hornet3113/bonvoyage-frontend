import { Metadata } from "next";
import LegalPageLayout from "@/app/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Política de Cookies · Bon Voyage",
  description: "Qué cookies usamos en Bon Voyage y cómo puedes gestionarlas.",
};

const sections = [
  {
    title: "1. ¿Qué son las cookies?",
    content:
      "Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo cuando los visitas. Nos ayudan a recordar tus preferencias, mantenerte autenticado y entender cómo se usa la plataforma para poder mejorarla.",
  },
  {
    title: "2. Tipos de cookies que usamos",
    content: [
      "Cookies esenciales: necesarias para el funcionamiento básico del servicio (autenticación con Clerk, sesión de usuario). No pueden desactivarse.",
      "Cookies de rendimiento: recopilan información anónima sobre cómo los usuarios navegan por la plataforma para mejorar su experiencia.",
      "Cookies funcionales: recuerdan tus preferencias (idioma, configuración del mapa, filtros de búsqueda) entre sesiones.",
      "Cookies de análisis: nos ayudan a entender métricas de uso de forma agregada y anónima.",
    ],
  },
  {
    title: "3. Cookies de terceros",
    content: [
      "Clerk (autenticación): gestiona la sesión de usuario de forma segura.",
      "Mapbox: necesario para el renderizado de mapas interactivos en el dashboard.",
      "Vercel: infraestructura de la plataforma, puede almacenar cookies técnicas de rendimiento.",
    ],
  },
  {
    title: "4. Duración de las cookies",
    content:
      "Las cookies de sesión se eliminan automáticamente al cerrar el navegador. Las cookies persistentes tienen una duración variable: las de autenticación duran hasta que cierras sesión, y las de preferencias hasta 12 meses.",
  },
  {
    title: "5. Cómo gestionar las cookies",
    content:
      "Puedes gestionar o deshabilitar las cookies no esenciales desde el banner de consentimiento que aparece al acceder por primera vez a la plataforma. También puedes configurar tu navegador para rechazar cookies, aunque esto puede afectar la funcionalidad del servicio. Ten en cuenta que las cookies esenciales no pueden desactivarse sin comprometer el funcionamiento de la plataforma.",
  },
  {
    title: "6. Configuración en el navegador",
    content: [
      "Google Chrome: Configuración → Privacidad y seguridad → Cookies.",
      "Mozilla Firefox: Opciones → Privacidad y seguridad → Cookies y datos del sitio.",
      "Safari: Preferencias → Privacidad → Gestionar datos de sitios web.",
      "Microsoft Edge: Configuración → Privacidad, búsqueda y servicios → Cookies.",
    ],
  },
  {
    title: "7. Actualizaciones de esta política",
    content:
      "Esta política puede actualizarse para reflejar cambios en el uso de cookies. Te notificaremos sobre cambios significativos mostrando de nuevo el banner de consentimiento para que puedas revisar y actualizar tus preferencias.",
  },
];

export default function CookiesPage() {
  return (
    <LegalPageLayout
      title="Política de Cookies"
      subtitle="Información sobre qué cookies utilizamos y cómo puedes controlarlas."
      lastUpdated="13 de abril de 2026"
      sections={sections}
    />
  );
}
