import { ObjectId, WithId } from "mongodb";
import { z } from "zod";
import { zfd } from "zod-form-data";

export const ZEmployee = z.object({
    employee_id: z.string().regex(/^[A-Z\d]{2,4}$/, "Employee Id allowed between 2-4 characters."),
    name: z.string().min(2, "At least 2 characters are required."),
    total_earned: z.coerce.number().positive(),
    currency_id: z.coerce.string().refine(value => ObjectId.isValid(value), "Choose a currency"),
});

export const ZEmployeePublic = ZEmployee.extend({
    id: z.coerce.string(),
});

export const ZFDEmployee = zfd.formData(ZEmployee);
  
export type IEmployee = z.infer<typeof ZEmployee>;
export type IEmployeeWithId = z.infer<typeof ZEmployeePublic>;
export type IMDBEmployee = Omit<IEmployee, 'currency_id'> & {
    currency_id: ObjectId;
    createdAt: Date;
    available_withdrawal: number;
};