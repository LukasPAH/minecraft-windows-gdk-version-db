interface IResponseJSON {
    code: string;
    data: IResponseData;
}

interface IResponseData {
    size: number;
    url: string;
}

interface IHistoricalVersions {
    file_version: 0;
    previewVersions: IVersion[];
    releaseVersions: IVersion[];
}

interface IVersion {
    version: string;
    url: string;
}

const versionsDB = JSON.parse(await Deno.readTextFile("./historical_versions.json")) as IHistoricalVersions;

const MinecraftURL = "https://xbox.skydevil.xyz/Game/GetGamePackage?contentId=7792d9ce-355a-493c-afbd-768f4a77c3b0&platform=2";
const PreviewURL = "https://xbox.skydevil.xyz/Game/GetGamePackage?contentId=98bd2335-9b01-4e4c-bd05-ccc01614078b&platform=2";

const headers = {
    Accept: "*/*",
    "Accept-Encoding": "gzip, deflate, dr, zstd",
    "Accept-Language": "en-US,en;q=0.9",
    Priority: "u=1, i",
    Referer: "https://xbox.skydevil.xyz/",
    "X-Author": "Devil",
    "X-Organization": "XboxDownload",
};

type InstallType = "Release" | "Preview";
type Versions = "releaseVersions" | "previewVersions";

function prettifyVersionNumbers(version: string): string {
    version = version.toLowerCase().replace("microsoft.minecraftuwp_", "").replace("microsoft.minecraftwindowsbeta_", "").replace(".0_x64__8wekyb3d8bbwe", "");
    const majorVersion = version.slice(0, -2);
    const minorVersion = version.slice(-2);
    return majorVersion + "." + minorVersion;
}

async function getURL(installType: InstallType, versions: Versions) {
    let urlToUse = MinecraftURL;
    if (installType === "Preview") urlToUse = PreviewURL;
    try {
        const response = await fetch(urlToUse, {
            method: "GET",
            headers: headers,
        });

        const text = await response.text();
        const json = JSON.parse(text) as IResponseJSON;

        const versionNameRegex = /[^\/]*.msixvc$/;
        const versionName = json.data.url;
        const versionNameMatch = versionName.match(versionNameRegex);
        if (versionNameMatch === null) return;

        const version = versionNameMatch[0].replace(".msixvc", "");
        const versionNumber = prettifyVersionNumbers(version);
        const name = `${installType} ${versionNumber}`;

        const versionsLength = versionsDB[versions].length;
        let length = 0;
        for (const versionEntry of versionsDB[versions]) {
            if (versionEntry.version !== name) length++;
        }

        if (versionsLength === length) {
            versionsDB[versions].push({ version: name, url: json.data.url });
            await Deno.writeTextFile("./historical_versions.json", JSON.stringify(versionsDB, null, 4));
        }
    } catch {
        // Suppress potential OS errors.
    }
}

await getURL("Release", "releaseVersions");
await getURL("Preview", "previewVersions");
