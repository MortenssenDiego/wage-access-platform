import { createCookie } from "@remix-run/node";
import { ObjectId } from "mongodb";

export const userPrefs = createCookie(`user-prefs.${new ObjectId().toHexString()}`, {
    maxAge: 604_800, // one week
});