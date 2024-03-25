import { ObjectId } from "mongodb";
import { z } from "zod";
import { zfd } from "zod-form-data";

export const ZTransaction = z.object({
    transaction_id: z.string().refine(value => ObjectId.isValid(value)),
    currency_id: z.string().refine(value => ObjectId.isValid(value)),
    amount: z.coerce.number().positive("Withdrawal amount must be positive."),
});


export const ZFDTransaction = zfd.formData(ZTransaction);

export type ITransaction = z.infer<typeof ZTransaction>;
export interface IMDBTransaction {
    transaction_id: ObjectId;
    employee_id: ObjectId;
    currency_id: ObjectId;
    amount: number;
    status: 'pending' | 'success' | 'failed';
    createdAt: Date;
};