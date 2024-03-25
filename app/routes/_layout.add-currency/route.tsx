import { redirect, json, ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import classes from "./styles.module.css";
import { Anchor, Card, Text, Group, Button } from "@mantine/core";
import { createCurrency } from "~/services/mongodb/mongodb.server";
import { ZCurrency, ZFDCurrency } from "~/types/currency";

export const action = async ({ request }: ActionFunctionArgs) => {
    const parsed = ZFDCurrency.safeParse(await request.formData()) as ReturnType<typeof ZCurrency.safeParse>;

    if (!parsed.success) {
        const errors = parsed.error.format();
        return json({ errors });
    }

    const currency = await createCurrency(parsed.data);
    console.log(currency);
    return redirect("/login");
};

export default function AddCurrency() {
    const { errors } = useActionData<typeof action>() ?? {};

    return (
        <Form method="post">
            <div className={classes.container}>
                <Card withBorder radius="md" className={classes.card}>
                    <Group justify="space-between">
                        <Text className={classes.title}>Currencies</Text>
                        <Anchor size="xs" c="dimmed" style={{ lineHeight: 1 }}>
                            Create Currency
                        </Anchor>
                    </Group>
                    <div className={classes.form}>
                        {(errors?.name?._errors.length ?? 0) > 0 && (
                            errors?.name?._errors.map(e => <em>{e}</em>)
                        )}
                        <input name="name" type="text" placeholder="Currency name" />
                        {(errors?.conversion_rate?._errors.length ?? 0) > 0 && (
                            errors?.conversion_rate?._errors.map(e => <em>{e}</em>)
                        )}
                        <input name="conversion_rate" step="any" type="number" placeholder="Conversion rate (1 = 1 Central Coin)" />
                    </div>
                </Card>
                <Button className={classes.link} type="submit">Create currency</Button>
            </div>
        </Form>
    );
}