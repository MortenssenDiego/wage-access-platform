import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { userPrefs } from "~/services/cookies.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const cookieHeader = request.headers.get("Cookie");
    const cookie = (await userPrefs.parse(cookieHeader)) || {};

    return redirect("/login",
        {
            headers: {
                "Set-Cookie": await userPrefs.serialize({
                    ...cookie,
                    userId: undefined,
                })
            }
        });
};