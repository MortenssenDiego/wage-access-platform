import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { ColorSchemeScript, MantineProvider, createTheme, MantineColorsTuple } from '@mantine/core';
import { userPrefs } from "~/services/cookies.server";
import { ActionFunctionArgs, LinksFunction, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import styles from '@mantine/core/styles.css?url';

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
];

export async function loader({
  request,
}: LoaderFunctionArgs) {    
  return json({});
}

export async function action({
  request,
}: ActionFunctionArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const cookie =
    (await userPrefs.parse(cookieHeader)) || {};
  const bodyParams = await request.formData();

  if (bodyParams.get("bannerVisibility") === "hidden") {
    cookie.showBanner = false;
  }

  return redirect("/", {
    headers: {
      "Set-Cookie": await userPrefs.serialize(cookie),
    },
  });
}

const myColor: MantineColorsTuple = [
  '#ffe9f1',
  '#ffd1e0',
  '#faa1bd',
  '#f66e99',
  '#f2437a',
  '#f02866',
  '#f0185c',
  '#d6094d',
  '#c00043',
  '#a90039'
];

const theme = createTheme({
  colors: {
    myColor,
  }
});


export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider defaultColorScheme={'dark'} theme={theme}>
          {children}
          <ScrollRestoration />
          <Scripts />
        </MantineProvider>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
