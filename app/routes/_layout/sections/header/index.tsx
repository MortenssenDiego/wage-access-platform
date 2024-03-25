import { Burger, Container, Group, UnstyledButton } from '@mantine/core';
import { Text } from "@mantine/core";
import classes from "./styles.module.css";
import { useDisclosure } from '@mantine/hooks';
import { Form, useLoaderData } from '@remix-run/react';
import { LoaderFunctionArgs, json } from '@remix-run/node';
import { userPrefs } from '~/services/cookies.server';

interface IHeaderProps {
  userId?: string;
}

export default function Header({ userId }: IHeaderProps) {
  const [opened, { toggle }] = useDisclosure(false);
  return (
    <>
      <header className={classes.header}>
        <Container size="md" className={classes.inner}>
          <Text>Wage Access Platform</Text>
          <Group gap={5} visibleFrom="xs">
            {!!userId && <Logout />}
          </Group>
          <Burger opened={opened} onClick={toggle} hiddenFrom="xs" size="sm" />
        </Container>
      </header>
    </>
  );
}

function Logout() {
  return (
    <Form method="post" action="/logout">
      <UnstyledButton type='submit'className={classes.item}>
        Logout
      </UnstyledButton>
    </Form>
  );
}