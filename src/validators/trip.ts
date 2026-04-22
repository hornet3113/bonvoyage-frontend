import { z } from "zod";

const tripBaseSchema = z.object({
  trip_name: z.string().min(1, "El nombre del viaje es requerido").max(100),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  total_budget: z.number().min(0).nullable().optional(),
  currency: z.enum(["USD", "EUR", "MXN", "GBP"]).default("USD"),
});

export const tripFormSchema = tripBaseSchema.refine(
  (data) => data.end_date >= data.start_date,
  { message: "La fecha de regreso debe ser igual o posterior a la de ida", path: ["end_date"] }
);

export type TripFormInput = z.infer<typeof tripFormSchema>;

export const tripEditSchema = tripBaseSchema;

export type TripEditInput = z.infer<typeof tripEditSchema>;
