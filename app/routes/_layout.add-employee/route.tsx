import { LoaderFunctionArgs, redirect, json, ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { ZEmployee, ZFDEmployee } from "~/types/employee";
import classes from "./styles.module.css";
import { Anchor, Card, Text, Group, Menu, UnstyledButton, Button } from "@mantine/core";
import { createEmployee, getCurrencies } from "~/services/mongodb/mongodb.server";

export async function loader({
    request,
}: LoaderFunctionArgs) {
    const currencies = (await getCurrencies()) ?? [];
    return json({ currencies });
}

export const action = async ({ request }: ActionFunctionArgs) => {
    const parsed = ZFDEmployee.safeParse(await request.formData()) as ReturnType<typeof ZEmployee.safeParse>;

    if (!parsed.success) {
        const errors = parsed.error.format();
        return json({ errors });
    }

    await createEmployee(parsed.data);

    return redirect("/login");
};

export default function AddEmployee() {
    const { errors } = useActionData<typeof action>() ?? {};
    const [currencyId, setCurrencyId] = useState<string | undefined>();

    return (
        <Form method="post">
            <div className={classes.container}>
                <Card withBorder radius="md" className={classes.card}>
                    <Group justify="space-between">
                        <Text className={classes.title}>Employees</Text>
                        <Anchor size="xs" c="dimmed" style={{ lineHeight: 1 }}>
                            Create Employee
                        </Anchor>
                    </Group>
                    <div className={classes.form}>
                        {(errors?.employee_id?._errors.length ?? 0) > 0 && (
                            errors?.employee_id?._errors.map(e => <em>{e}</em>)
                        )}
                        <input name="employee_id" type="text" placeholder="Employee ID" />
                        {(errors?.name?._errors.length ?? 0) > 0 && (
                            errors?.name?._errors.map(e => <em>{e}</em>)
                        )}
                        <input name="name" type="text" placeholder="Employee name" />
                        {(errors?.total_earned?._errors.length ?? 0) > 0 && (
                            errors?.total_earned?._errors.map(e => <em>{e}</em>)
                        )}
                        <input name="total_earned" type="number" placeholder="Employee total earned" />
                        <input name="currency_id" type="hidden" value={currencyId} />
                        {(errors?.currency_id?._errors.length ?? 0) > 0 && (
                            errors?.currency_id?._errors.map(e => <em>{e}</em>)
                        )}
                        <CurrenciesPicker selectCurrency={setCurrencyId} />
                    </div>
                </Card>
                <Button className={classes.link} type="submit">Create employee</Button>
            </div>
        </Form>
    );
}

interface CurrenciesPickerProps {
    selectCurrency: (id: string) => void;
}

export function CurrenciesPicker({ selectCurrency }: CurrenciesPickerProps) {
    const { currencies } = useLoaderData<typeof loader>();

    const handleCurrencyChange = (item: any) => {
        setSelected(item);
        selectCurrency(item.id);
    };

    const [opened, setOpened] = useState(false);
    const [selected, setSelected] = useState(currencies ? currencies[0] : { name: "No currencies available" });

    return (
        <Menu
            onOpen={() => setOpened(true)}
            onClose={() => setOpened(false)}
            radius="md"
            width="target"
            withinPortal
        >
            <Menu.Target>
                <UnstyledButton className={classes.control} data-expanded={opened || undefined}>
                    <Group gap="xs">
                        <span className={classes.label}>{selected?.name}</span>
                    </Group>
                </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
                {
                    currencies && currencies?.map((item) => (
                        <Menu.Item
                            onClick={() => handleCurrencyChange(item)}
                            key={item.id}
                        >
                            {item.name}
                        </Menu.Item>
                    ))
                }
            </Menu.Dropdown>
        </Menu>
    );
}