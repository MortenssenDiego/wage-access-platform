import { Outlet, json, useLoaderData } from "@remix-run/react";
import Header from "./sections/header";
import { LoaderFunctionArgs } from "@remix-run/node";
import { userPrefs } from "~/services/cookies.server";

export async function loader({
    request,
  }: LoaderFunctionArgs) {
    const cookieHeader = request.headers.get("Cookie");
    const cookie = (await userPrefs.parse(cookieHeader)) || {};
  
    return json({ userId: cookie.userId });
  }

export default function Layout() {
    const { userId } = useLoaderData<typeof loader>();
    
    return (
        <>
            <Header userId={userId} />
            <main>
                <Outlet />
            </main>
        </>
    );
}