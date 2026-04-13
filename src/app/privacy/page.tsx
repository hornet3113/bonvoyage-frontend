import { Metadata } from "next";
import LegalPageLayout from "@/app/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Política de Privacidad · Bon Voyage",
  description: "Cómo recopilamos, usamos y protegemos tu información personal en Bon Voyage.",
};

const sections = [
  {
    title: "1. Responsable del tratamiento",
    content:
      "Bon Voyage es el responsable del tratamiento de los datos personales que nos proporcionas. Si tienes alguna pregunta sobre cómo gestionamos tu información, puedes contactarnos en cualquier momento a través de los canales habilitados en la plataforma.",
  },
  {
    title: "2. Datos que recopilamos",
    content: [
      "Información de cuenta: nombre, dirección de correo electrónico y contraseña (gestionada de forma segura mediante Clerk).",
      "Datos de uso: páginas visitadas, destinos consultados, itinerarios creados y preferencias de viaje.",
      "Datos de geolocalización: solo cuando accedes a las funcionalidades de mapa y con tu consentimiento explícito.",
      "Comunicaciones: mensajes de soporte o feedback que nos envíes directamente.",
    ],
  },
  {
    title: "3. Cómo usamos tu información",
    content: [
      "Proporcionar, mantener y mejorar los servicios de planificación de viajes.",
      "Personalizar tu experiencia y mostrarte destinos relevantes.",
      "Enviarte notificaciones sobre tus viajes y actualizaciones del servicio (puedes desactivarlas en tu perfil).",
      "Analizar el uso agregado de la plataforma para mejorar su funcionamiento.",
      "Cumplir con obligaciones legales aplicables.",
    ],
  },
  {
    title: "4. Base legal del tratamiento",
    content:
      "El tratamiento de tus datos se basa en la ejecución del contrato de uso del servicio, tu consentimiento cuando se requiere (por ejemplo, para cookies no esenciales), y nuestro interés legítimo en mejorar la plataforma y prevenir el fraude.",
  },
  {
    title: "5. Compartición de datos",
    content:
      "No vendemos ni alquilamos tus datos personales a terceros. Podemos compartir información con proveedores de servicios que nos ayudan a operar la plataforma (como Clerk para autenticación, Mapbox para mapas o Vercel para infraestructura), siempre bajo acuerdos de confidencialidad y con garantías adecuadas de protección.",
  },
  {
    title: "6. Retención de datos",
    content:
      "Conservamos tu información mientras tu cuenta esté activa. Si solicitas la eliminación de tu cuenta, tus datos personales serán eliminados o anonimizados en un plazo máximo de 30 días, salvo que la ley nos obligue a conservarlos por más tiempo.",
  },
  {
    title: "7. Tus derechos",
    content: [
      "Acceso: solicitar una copia de los datos personales que tenemos sobre ti.",
      "Rectificación: corregir información inexacta o incompleta desde tu perfil.",
      "Supresión: solicitar la eliminación de tu cuenta y datos asociados.",
      "Portabilidad: recibir tus datos en un formato estructurado y legible por máquina.",
      "Oposición: oponerte al tratamiento de tus datos basado en interés legítimo.",
    ],
  },
  {
    title: "8. Seguridad",
    content:
      "Aplicamos medidas técnicas y organizativas adecuadas para proteger tu información contra accesos no autorizados, pérdida o alteración. La autenticación está gestionada por Clerk, que cumple con los estándares de seguridad SOC 2 Tipo II.",
  },
  {
    title: "9. Cambios en esta política",
    content:
      "Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios significativos por correo electrónico o mediante un aviso destacado en la plataforma antes de que entren en vigor.",
  },
];

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Política de Privacidad"
      subtitle="Nos comprometemos a proteger tu privacidad y ser transparentes sobre cómo usamos tus datos."
      lastUpdated="13 de abril de 2026"
      sections={sections}
    />
  );
}
