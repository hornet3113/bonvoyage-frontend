import { Metadata } from "next";
import LegalPageLayout from "@/app/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Términos de Uso · Bon Voyage",
  description: "Condiciones que rigen el uso de la plataforma Bon Voyage.",
};

const sections = [
  {
    title: "1. Aceptación de los términos",
    content:
      "Al registrarte o usar Bon Voyage, aceptas quedar vinculado por estos Términos de Uso. Si no estás de acuerdo con alguna de las condiciones aquí establecidas, no debes utilizar el servicio.",
  },
  {
    title: "2. Descripción del servicio",
    content:
      "Bon Voyage es una plataforma de planificación de viajes que te permite crear itinerarios, descubrir destinos, buscar vuelos y hoteles, y organizar tus experiencias de viaje en un solo lugar. El servicio se ofrece 'tal cual' y puede estar sujeto a cambios, interrupciones o descontinuaciones en cualquier momento.",
  },
  {
    title: "3. Registro y seguridad de la cuenta",
    content: [
      "Debes tener al menos 16 años para crear una cuenta en Bon Voyage.",
      "Eres responsable de mantener la confidencialidad de tus credenciales de acceso.",
      "Debes notificarnos inmediatamente si sospechas de un acceso no autorizado a tu cuenta.",
      "No está permitido crear cuentas en nombre de terceros sin su consentimiento expreso.",
    ],
  },
  {
    title: "4. Uso aceptable",
    content: [
      "Usar el servicio únicamente para fines legales y personales.",
      "No intentar acceder a sistemas, datos o cuentas que no te pertenecen.",
      "No publicar contenido falso, engañoso, difamatorio o que vulnere derechos de terceros.",
      "No utilizar el servicio para actividades comerciales no autorizadas o spam.",
      "No interferir con el funcionamiento técnico de la plataforma.",
    ],
  },
  {
    title: "5. Contenido del usuario",
    content:
      "Al subir o compartir contenido en Bon Voyage (comentarios, listas de destinos, etc.), nos concedes una licencia no exclusiva, libre de regalías, para usar dicho contenido con el fin de operar y mejorar el servicio. Conservas todos los derechos de propiedad sobre tu contenido.",
  },
  {
    title: "6. Propiedad intelectual",
    content:
      "Todos los derechos sobre el diseño, código, marca y contenido de Bon Voyage son propiedad de sus respectivos titulares. No está permitido copiar, modificar, distribuir o crear obras derivadas de la plataforma sin autorización expresa.",
  },
  {
    title: "7. Limitación de responsabilidad",
    content:
      "Bon Voyage no se responsabiliza por decisiones de viaje tomadas en base a la información de la plataforma, interrupciones del servicio, pérdidas de datos, ni por servicios de terceros (aerolíneas, hoteles, proveedores de mapas) accesibles a través de la plataforma. El uso del servicio es bajo tu propia responsabilidad.",
  },
  {
    title: "8. Suspensión y cancelación",
    content:
      "Nos reservamos el derecho de suspender o cancelar cuentas que violen estos términos, sin previo aviso y sin responsabilidad hacia el usuario. Puedes eliminar tu cuenta en cualquier momento desde la configuración de tu perfil.",
  },
  {
    title: "9. Modificaciones",
    content:
      "Podemos actualizar estos términos en cualquier momento. Los cambios entrarán en vigor a los 15 días de su publicación. El uso continuado del servicio tras ese plazo implica la aceptación de los nuevos términos.",
  },
  {
    title: "10. Ley aplicable",
    content:
      "Estos términos se rigen por la legislación vigente. Para cualquier disputa derivada del uso de Bon Voyage, las partes se someten a los tribunales competentes según la normativa aplicable.",
  },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Términos de Uso"
      subtitle="Por favor, lee estas condiciones antes de usar Bon Voyage."
      lastUpdated="13 de abril de 2026"
      sections={sections}
    />
  );
}
