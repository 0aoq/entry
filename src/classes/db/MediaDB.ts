import { BunFile } from "bun";
import path from "node:path";
import fs from "node:fs";

import EntryDB from "./EntryDB";

/**
 * @export
 * @class Media
 */
export default class Media {
    public static MediaLocation = "";
    private readonly db: EntryDB;

    /**
     * Creates an instance of Expiry.
     * @memberof Expiry
     */
    constructor(db: EntryDB) {
        this.db = db;
    }

    /**
     * @method Initialize
     *
     * @return {Promise<void>}
     * @memberof Expiry
     */
    public async Initialize(): Promise<void> {
        Media.MediaLocation = path.resolve(EntryDB.DataDirectory, "media");

        // check config
        if (!EntryDB.config) await EntryDB.GetConfig();

        if (
            !EntryDB.config.app ||
            !EntryDB.config.app.media ||
            EntryDB.config.app.media.enabled === false
        )
            return;

        // create media dir if it doesn't already exist
        if (!fs.existsSync(Media.MediaLocation)) fs.mkdirSync(Media.MediaLocation);

        // return
        return;
    }

    /**
     * @method GetFile
     *
     * @param {string} owner
     * @param {string} name
     * @return {Promise<[boolean, string, BunFile?]>}
     * @memberof Media
     */
    public async GetFile(
        owner: string,
        name: string
    ): Promise<[boolean, string, BunFile?]> {
        // don't check if media is disabled, as files should still be viewable even with media disabled!

        // ...
        const OwnerFolder = path.resolve(
            Media.MediaLocation,
            owner.replaceAll("/", ":sl:")
        );

        // return false if OwnerFolder doesn't exist
        if (!fs.existsSync(OwnerFolder)) return [false, "Owner has no files"];

        // make sure file exists
        const FilePath = path.resolve(OwnerFolder, name);
        if (!fs.existsSync(FilePath)) return [false, "File does not exist!"];

        // get file
        const file = Bun.file(FilePath);

        // return
        return [true, "File exists", file];
    }

    /**
     * @method UploadFile
     *
     * @param {string} owner
     * @param {File} file
     * @return {Promise<[boolean, string]>}
     * @memberof Media
     */
    public async UploadFile(owner: string, file: File): Promise<[boolean, string]> {
        // ideally, the owner value would be checked for the correct password prior to calling UploadFile

        if (
            !EntryDB.config.app ||
            !EntryDB.config.app.media ||
            EntryDB.config.app.media.enabled === false
        )
            return [false, "Media disabled"];

        // ...
        const OwnerFolder = path.resolve(
            Media.MediaLocation,
            owner.replaceAll("/", ":sl:")
        );

        // create owner folder if it doesn't exist
        if (!fs.existsSync(OwnerFolder))
            fs.mkdirSync(OwnerFolder, { recursive: true });

        // check size
        if (file.size > (EntryDB.config.app.media.max_size || 52428800))
            return [false, "File too large!"];

        // ...
        const FilePath = path.resolve(OwnerFolder, file.name.replaceAll(" ", "_"));

        // make sure file doesn't already exist
        if (fs.existsSync(FilePath)) return [false, "File already exists"];

        // upload file
        await Bun.write(FilePath, file);

        // return
        return [true, "File uploaded"];
    }

    /**
     * @method DeleteFile
     *
     * @param {string} owner
     * @param {string} name
     * @return {Promise<[boolean, string]>}
     * @memberof Media
     */
    public async DeleteFile(
        owner: string,
        name: string
    ): Promise<[boolean, string]> {
        // ideally, the owner value would be checked for the correct password prior to calling DeleteFile

        if (
            !EntryDB.config.app ||
            !EntryDB.config.app.media ||
            EntryDB.config.app.media.enabled === false
        )
            return [false, "Media disabled"];

        // ...
        const OwnerFolder = path.resolve(
            Media.MediaLocation,
            owner.replaceAll("/", ":sl:")
        );

        // return false if OwnerFolder doesn't exist
        if (!fs.existsSync(OwnerFolder)) return [false, "Owner has no files"];

        // make sure file exists
        const FilePath = path.resolve(OwnerFolder, name);
        if (!fs.existsSync(FilePath)) return [false, "File does not exist!"];

        // delete file
        fs.rmSync(FilePath);

        // return
        return [true, "File deleted"];
    }

    /**
     * @method DeleteOwner
     *
     * @param {string} owner
     * @return {Promise<[boolean, string]>}
     * @memberof Media
     */
    public async DeleteOwner(owner: string): Promise<[boolean, string]> {
        // ideally, the owner value would be checked for the correct password prior to calling DeleteOwner

        if (
            !EntryDB.config.app ||
            !EntryDB.config.app.media ||
            EntryDB.config.app.media.enabled === false
        )
            return [false, "Media disabled"];

        // ...
        const OwnerFolder = path.resolve(
            Media.MediaLocation,
            owner.replaceAll("/", ":sl:")
        );

        // return false if OwnerFolder doesn't exist
        if (!fs.existsSync(OwnerFolder)) return [false, "Owner has no files"];

        // delete directory
        fs.rmdirSync(OwnerFolder);

        // return
        return [true, "File deleted"];
    }

    /**
     * @method GetMediaByOwner
     *
     * @param {string} owner
     * @return {Promise<[boolean, string, string[]?]>}
     * @memberof Media
     */
    public async GetMediaByOwner(
        owner: string
    ): Promise<[boolean, string, string[]?]> {
        if (
            !EntryDB.config.app ||
            !EntryDB.config.app.media ||
            EntryDB.config.app.media.enabled === false
        )
            return [false, "Media disabled"];

        // ...
        const OwnerFolder = path.resolve(
            Media.MediaLocation,
            owner.replaceAll("/", ":sl:")
        );

        // return false if OwnerFolder doesn't exist
        if (!fs.existsSync(OwnerFolder)) return [false, "Owner has no files"];

        // get all files
        const files = fs.readdirSync(OwnerFolder);

        // return files
        return [true, `${files.length} files`, files];
    }
}
