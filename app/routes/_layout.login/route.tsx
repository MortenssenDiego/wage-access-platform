import {
    Card,
    Text,
    SimpleGrid,
    UnstyledButton,
    Anchor,
    Group,
    useMantineTheme,
} from '@mantine/core';
import {
    IconUser
} from '@tabler/icons-react';
import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from '@remix-run/node';
import { userPrefs } from '~/services/cookies.server';
import { Form, Link, useLoaderData } from '@remix-run/react';
import { getCurrencies, getEmployees } from '~/services/mongodb/mongodb.server';
import { ObjectId } from "mongodb";
import classes from './styles.module.css';
import { IEmployeeWithId } from '~/types/employee';
import { z } from 'zod';
import { zfd } from 'zod-form-data';

export async function loader({
    request,
}: LoaderFunctionArgs) {
    const cookieHeader = request.headers.get("Cookie");
    const cookie = (await userPrefs.parse(cookieHeader)) || {};

    if (ObjectId.isValid(cookie.userId)) {
        return redirect("/");
    }

    const employees = (await getEmployees()) ?? [];
    const currencies = (await getCurrencies()) ?? [];
    return json({ employees, currencies });
}

const ZSelectEmployee = z.object({
    id: z.coerce.string().refine(value => ObjectId.isValid(value), "Choose an employee"),
});
const ZFDSelectEmployee = zfd.formData(ZSelectEmployee);

export const action = async ({ request }: ActionFunctionArgs) => {
    const cookieHeader = request.headers.get("Cookie");
    const cookie = (await userPrefs.parse(cookieHeader)) || {};
    const parsed = ZFDSelectEmployee.safeParse(await request.formData()) as ReturnType<typeof ZSelectEmployee.safeParse>;

    if (!parsed.success) {
        const errors = parsed.error.format();
        return json({ errors });
    }

    return redirect("/",
        {
            headers: {
                "Set-Cookie": await userPrefs.serialize({
                    ...cookie,
                    userId: parsed.data.id,
                })
            }
        });
};

type EmployeeButtonProps = {
    item: IEmployeeWithId;
};

function EmployeeButton({ item }: EmployeeButtonProps) {
    const theme = useMantineTheme();
    return (
        <Form method="post">
            <input type="hidden" name="id" value={item.id} />
            <UnstyledButton type='submit' className={classes.item}>
                <IconUser size="2rem" />
                <Text size="xs" mt={7}>
                    {item.name}
                </Text>
            </UnstyledButton>
        </Form>
    );
}

export default function Employees() {
    const { employees, currencies } = useLoaderData<typeof loader>();

    return (
        <>
            <div className={classes.container}>
                <Card withBorder radius="md" className={classes.card}>
                    <Group justify="space-between">
                        <Text className={classes.title}>Employees</Text>
                        <Anchor size="xs" c="dimmed" style={{ lineHeight: 1 }}>
                            Select Employee
                        </Anchor>
                    </Group>
                    <SimpleGrid cols={3} mt="md">
                        {(employees?.length ?? 0) > 0 && (
                            employees!.map((e) => <EmployeeButton key={e.id} item={e} />)
                        )}
                    </SimpleGrid>
                    {(employees?.length ?? 0) == 0 && (
                        <Text>No employees found.</Text>
                    )}
                </Card>
                <Link className={classes.link} to={"/add-employee"}>Add a new employee</Link>
            </div>
            <div className={classes.container}>
                <Card withBorder radius="md" className={classes.card}>
                    <Group justify="space-between">
                        <Text className={classes.title}>Currencies</Text>
                        <Anchor size="xs" c="dimmed" style={{ lineHeight: 1 }}>
                            Available currencies
                        </Anchor>
                    </Group>
                    {(currencies?.length ?? 0) > 0 && (
                        currencies!.map((e) => <p key={e.id}>Name: {e.name} Rate: {e.conversion_rate}</p>)  
                    )}
                    {(currencies?.length ?? 0) == 0 && (
                        <Text>No currencies found.</Text>
                    )}
                </Card>
                <Link className={classes.link} to={"/add-currency"}>Add a new currency</Link>
            </div>
        </>
    );
}