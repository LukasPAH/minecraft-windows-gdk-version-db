import { live, xnet } from "@xboxreplay/xboxlive-auth";
import { IUpdateResponse, IHistoricalVersions, InstallType, Versions } from "./types.ts";

const CLIENT_ID = "00000000402b5328";
const SCOPE = "service::user.auth.xboxlive.com::MBI_SSL";
const RELEASE_ID = "7792d9ce-355a-493c-afbd-768f4a77c3b0";
const PREVIEW_ID = "98bd2335-9b01-4e4c-bd05-ccc01614078b";
const VERSIONS_DB = JSON.parse(await Deno.readTextFile("./historical_versions.json")) as IHistoricalVersions;

async function refreshTokens() {
    const REFRESH_TOKEN = Deno.env.get("REFRESH_TOKEN");
    if (REFRESH_TOKEN === undefined) {
        console.log("Refresh token not found! Please generate a new token!");
        return;
    }
    const accessTokenResponse = await live.refreshAccessToken(REFRESH_TOKEN, CLIENT_ID, SCOPE);
    await Deno.writeTextFile(".env", `REFRESH_TOKEN=${accessTokenResponse.refresh_token}`);

    const authenticationBody = {
        RelyingParty: "http://auth.xboxlive.com",
        TokenType: "JWT",
        Properties: {
            AuthMethod: "RPS",
            SiteName: "user.auth.xboxlive.com",
            RpsTicket: accessTokenResponse.access_token,
        },
    };

    const authenticationURL = new URL("user/authenticate", "https://user.auth.xboxlive.com/");

    const authenticationResponse = await fetch(authenticationURL.toString(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-xbl-contract-version": "1",
        },
        body: JSON.stringify(authenticationBody),
    });

    if (!authenticationResponse.ok) {
        return;
    }

    const userToken = JSON.parse(await authenticationResponse.text()).Token;
    const deviceToken = (await xnet.experimental.createDummyWin32DeviceToken()).Token;

    const updateURL = new URL("xsts/authorize", "https://xsts.auth.xboxlive.com/");

    const updateBody = {
        RelyingParty: "http://update.xboxlive.com",
        TokenType: "JWT",
        Properties: {
            UserTokens: [userToken],
            SandboxId: "RETAIL",
            DeviceToken: deviceToken,
        },
    };

    const updateResponse = await fetch(updateURL.toString(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-xbl-contract-version": "1",
        },
        body: JSON.stringify(updateBody),
    });

    if (!updateResponse.ok) {
        return;
    }

    const updateResponseJSON = JSON.parse(await updateResponse.text());

    const authorizationHeader = `XBL3.0 x=${updateResponseJSON.DisplayClaims.xui[0].uhs};${updateResponseJSON.Token}`;

    const releaseURL = await getVersions(RELEASE_ID, authorizationHeader);
    const previewURL = await getVersions(PREVIEW_ID, authorizationHeader);

    if (releaseURL !== undefined) await assessAndUpdateHistoricalVersions("Release", "releaseVersions", releaseURL);
    if (previewURL !== undefined) await assessAndUpdateHistoricalVersions("Preview", "previewVersions", previewURL)
}

async function getVersions(releaseType: string, authorizationHeader: string) {
    const versionsResponse = await fetch(`https://packagespc.xboxlive.com/GetBasePackage/${releaseType}`, {
        method: "GET",
        headers: {
            Authorization: authorizationHeader,
        },
    });
    if (!versionsResponse.ok) {
        return;
    }

    const versionsResponseJSON = JSON.parse(await versionsResponse.text()) as IUpdateResponse;

    for (const packageFile of versionsResponseJSON.PackageFiles) {
        if (!packageFile.FileName.endsWith(".msixvc")) continue;

        const versionURL = packageFile.CdnRootPaths[0] + packageFile.RelativeUrl;
        return versionURL;
    }
}

function prettifyVersionNumbers(version: string): string {
    version = version.toLowerCase().replace("microsoft.minecraftuwp_", "").replace("microsoft.minecraftwindowsbeta_", "").replace(".0_x64__8wekyb3d8bbwe", "");
    const majorVersion = version.slice(0, -2);
    const minorVersion = version.slice(-2);
    return majorVersion + "." + minorVersion;
}

async function assessAndUpdateHistoricalVersions(installType: InstallType, versions: Versions, url: string) {
    const versionNameRegex = /[^\/]*.msixvc$/;
    const versionNameMatch = url.match(versionNameRegex);
    if (versionNameMatch === null) return;

    const version = versionNameMatch[0].replace(".msixvc", "");
    const versionNumber = prettifyVersionNumbers(version);
    const name = `${installType} ${versionNumber}`;

    const versionsLength = VERSIONS_DB[versions].length;
    let length = 0;
    for (const versionEntry of VERSIONS_DB[versions]) {
        if (versionEntry.version !== name) length++;
    }

    if (versionsLength === length) {
        VERSIONS_DB[versions].push({ version: name, url: url });
        await Deno.writeTextFile("./historical_versions.json", JSON.stringify(VERSIONS_DB, null, 4));
    }
}

await refreshTokens();
