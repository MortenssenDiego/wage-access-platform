import { LoaderFunctionArgs, json, redirect, type MetaFunction } from "@remix-run/node";
import classes from './styles.module.css';
import { Card, Group, Anchor, Text, UnstyledButton } from "@mantine/core";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { ObjectId } from "mongodb";
import { userPrefs } from "~/services/cookies.server";
import { findEmployeeTransactions, getCurrency, getEmployee } from "~/services/mongodb/mongodb.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Wage Access Platform" },
    { name: "description", content: "Welcome to the Wage Access Platform Challenge!" },
  ];
};

export async function loader({
  request,
}: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const cookie = (await userPrefs.parse(cookieHeader)) || {};

  if (!ObjectId.isValid(cookie.userId)) {
    return redirect("/login");
  }

  const employee = await getEmployee(new ObjectId(cookie.userId as string));
  const currency = await getCurrency(employee!.currency_id);
  const transactions = (await findEmployeeTransactions(new ObjectId(cookie.userId as string))) ?? [];
  return json({ employee, currency, transactions });
}

export default function Index() {
  const { employee, currency } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <>
      <div className={classes.container}>
        <Card withBorder radius="md" className={classes.card}>
          <Group justify="space-between">
            <Text className={classes.title}>Employee account</Text>
            <Anchor size="xs" c="dimmed" style={{ lineHeight: 1 }}>
              {employee!.name}
            </Anchor>
          </Group>
          <p>Total earnings: {employee!.total_earned.toFixed(2)}</p>
          <p>Available withdrawal: {employee!.available_withdrawal.toFixed(2)}</p>
          <p>Account currency: {currency!.name}</p>
          <UnstyledButton className={classes.link} onClick={() => navigate("/withdraw")}>Early withdraw</UnstyledButton>
        </Card>
      </div>
      <div className={classes.container}>
        <Card withBorder radius="md" className={classes.card}>
          <Group justify="space-between">
            <Text className={classes.title}>Withdrawals</Text>
            <Anchor size="xs" c="dimmed" style={{ lineHeight: 1 }}>
              Previous withdrawals
            </Anchor>
          </Group>
          <PreviousWithdrawals />
        </Card>
      </div>
    </>
  );
}

function PreviousWithdrawals() {
  const { transactions } = useLoaderData<typeof loader>();
  return (
    <>
      {(transactions?.length ?? 0) > 0 && (
        transactions!.map((e) => <p key={e.transaction_id}>Amount: {e.amount} Status: {e.status}</p>)
      )}
      {
        (transactions?.length ?? 0) == 0 && (
          <Text>No currencies found.</Text>
        )
      }
    </>
  );
}