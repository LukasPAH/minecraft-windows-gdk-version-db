export interface IUpdateResponse {
    PackageFound: boolean;
    ContentId: string;
    VersionId: string;
    Version: string;
    PackageFiles: IPackageFile[];
    PackageMetadata: IPackageMetadata[];
    HashOfHashes: null;
    UpdatePredownload: boolean;
    AvailabilityDate: string;
}

interface IPackageFile {
    ContentId: string;
    VersionId: string;
    FileName: string;
    FileSize: number;
    FileHash: string;
    KeyBlob: string;
    CdnRootPaths: string[];
    BackgroundCdnRootPaths: string[];
    RelativeUrl: string;
    UpdateTyoe: number;
    DeltaVersionId: null;
    LicenseUsageType: number;
    ModifiedDate: string;
}

interface IPackageMetadata {
    EstimatedTotalDownloadSize: number;
    BackgroundCdnRootPaths: string[];
    CdnRoots: string[];
    Files: IFile[];
}

interface IFile {
    Name: string;
    Size: number;
    RelativeUrl: string;
    License: string;
}

interface IResponseData {
    size: number;
    url: string;
}

export interface IHistoricalVersions {
    file_version: 0;
    previewVersions: IVersion[];
    releaseVersions: IVersion[];
}

interface IVersion {
    version: string;
    urls: string[];
}

export type InstallType = "Release" | "Preview";
export type Versions = "releaseVersions" | "previewVersions";