import { LoaderFunctionArgs, json, redirect, type MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import classes from './styles.module.css';
import { Card, Group, Anchor, Text, UnstyledButton, Menu, Button } from "@mantine/core";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { ObjectId } from "mongodb";
import { userPrefs } from "~/services/cookies.server";
import { getCurrencies, getEmployee, processWithdrawal } from "~/services/mongodb/mongodb.server";
import { useEffect, useState } from "react";
import { ZFDTransaction, ZTransaction } from "~/types/transactions";

export async function loader({
    request,
}: LoaderFunctionArgs) {
    const cookieHeader = request.headers.get("Cookie");
    const cookie = (await userPrefs.parse(cookieHeader)) || {};

    if (!ObjectId.isValid(cookie.userId)) {
        return redirect("/login");
    }

    const employee = await getEmployee(new ObjectId(cookie.userId as string));
    const transactionId = new ObjectId();
    const currencies = (await getCurrencies()) ?? [];
    return json({ employee, transactionId, currencies });
}

export default function Withdraw() {
    const { employee, transactionId, currencies } = useLoaderData<typeof loader>();
    const { errors } = useActionData<typeof action>() ?? {};
    const [currencyId, setCurrencyId] = useState<string | undefined>();

    useEffect(() => setCurrencyId(currencies[0].id), []);

    return (
        <Form method="post" className={classes.container}>
            <input type="hidden" value={transactionId} name="transaction_id" />
            <Card withBorder radius="md" className={classes.card}>
                <Group justify="space-between">
                    <Text className={classes.title}>Withdraw</Text>
                    <Anchor size="xs" c="dimmed" style={{ lineHeight: 1 }}>
                        ${employee!.available_withdrawal.toFixed(2)} available for withdrawal.
                    </Anchor>
                </Group>
                {(errors?.amount?._errors.length ?? 0) > 0 && (
                    errors?.amount?._errors.map(e => <em>{e}</em>)
                )}
                <input step="any" type="number" name="amount" onChange={(e) => employee!.available_withdrawal < +e.target.value ? employee!.available_withdrawal : e.target.value} placeholder="Amount to withdraw" />
                <input name="currency_id" type="hidden" value={currencyId} />
                {(errors?.currency_id?._errors.length ?? 0) > 0 && (
                    errors?.currency_id?._errors.map(e => <em>{e}</em>)
                )}
                <CurrenciesPicker selectCurrency={setCurrencyId} />
            </Card>
            <Button className={classes.link} type="submit">Confirm withdraw</Button>
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

export const action = async ({ request }: ActionFunctionArgs) => {
    const parsed = ZFDTransaction.safeParse(await request.formData()) as ReturnType<typeof ZTransaction.safeParse>;
    const cookieHeader = request.headers.get("Cookie");
    const cookie = (await userPrefs.parse(cookieHeader)) || {};

    if (!parsed.success) {
        const errors = parsed.error.format();
        return json({ errors });
    }

    const withdrawal = await processWithdrawal(cookie.userId, parsed.data);
    console.log(withdrawal);
    return redirect("/");
}
