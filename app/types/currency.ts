import { z } from "zod";
import { zfd } from "zod-form-data";

export const ZCurrency = z.object({
    name: z.string().regex(/^[A-Z]{2,4}$/, "Currency Name allowed between 2-4 characters."),
    conversion_rate: z.coerce.number().positive("Conversion Rate must be positive."),
});

export const ZCurrencyPublic = ZCurrency.extend({
    id: z.coerce.string(),
});

export const ZFDCurrency = zfd.formData(ZCurrency);

export type ICurrency = z.infer<typeof ZCurrency>;
export type ICurrencyWithId = z.infer<typeof ZCurrencyPublic>;
export type IMDBCurrency = ICurrency & {
    createdAt: Date;
};