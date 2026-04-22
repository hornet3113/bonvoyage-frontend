import { z } from "zod";

export const coordsSchema = z.object({
  lat: z
    .string()
    .min(1, "Latitud requerida")
    .transform(Number)
    .pipe(z.number().min(-90).max(90)),
  lng: z
    .string()
    .min(1, "Longitud requerida")
    .transform(Number)
    .pipe(z.number().min(-180).max(180)),
});

export type CoordsInput = z.infer<typeof coordsSchema>;
