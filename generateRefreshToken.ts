import { live, XSAPIClient } from "@xboxreplay/xboxlive-auth";
import * as readline from "readline-sync";

const CLIENT_ID = "00000000402b5328";
const REDIRECT_URL = "https://login.live.com/oauth20_desktop.srf";
const SCOPE = "service::user.auth.xboxlive.com::MBI_SSL";

async function getReloadToken() {
    const authUrl = live.getAuthorizeUrl(CLIENT_ID, SCOPE, "code", REDIRECT_URL);
    console.log("Enter this link in a web browser and paste back the link in the console after authenticating:\n");

    const userResponse = readline.question(authUrl + "\n\n");
    if (!userResponse.includes("login.live.com")) return;

    const codeRegex = /code=(.+)&/;

    const regexMatch = userResponse.match(codeRegex);
    if (regexMatch === null) return;

    const code = regexMatch[1];

    const url = `https://login.live.com/oauth20_token.srf?client_id=${CLIENT_ID}&code=${code}&redirect_uri=${REDIRECT_URL}&grant_type=authorization_code&scope=${SCOPE}`;

    const XSAPIData = await XSAPIClient.get(url);
    await Deno.writeTextFile(".env", `REFRESH_TOKEN=${XSAPIData.data.refresh_token}`);
}

await getReloadToken();
