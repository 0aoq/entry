/**
 * @file Create Entry DB
 * @name EntryDB.ts
 * @license MIT
 */

import path from "node:path";

import { Database } from "bun:sqlite";
import { CreateHash } from "./Hash";
import SQL from "./SQL";

import pack from "../../../package.json";

export type Paste = {
    Content: string;
    EditPassword: string;
    CustomURL: string;
    PubDate: string;
    EditDate: string;
    HostServer?: string; // this is not actually stored in the record
};

/**
 * @export
 * @class EntryDB
 */
export default class EntryDB {
    private readonly DataDirectory = path.resolve(process.cwd(), "data");
    public readonly db: Database;

    private static readonly MaxContentLength = 200000;
    private static readonly MaxPasswordLength = 256;
    private static readonly MaxCustomURLLength = 100;

    private static readonly MinContentLength = 1;
    private static readonly MinPasswordLength = 5;
    private static readonly MinCustomURLLength = 2;

    private static readonly URLRegex = /^[\w\_\-]+$/gm; // custom urls must match this to be accepted

    /**
     * Creates an instance of EntryDB.
     * @memberof EntryDB
     */
    constructor() {
        // create db link
        const [db, isNew] = SQL.CreateDB("entry");
        this.db = db;

        // check if we need to create tables
        (async () => {
            if (isNew) {
                await SQL.QueryOBJ({
                    db,
                    query: `CREATE TABLE Pastes (
                        Content varchar(${EntryDB.MaxContentLength}),
                        EditPassword varchar(${EntryDB.MaxPasswordLength}),
                        CustomURL varchar(${EntryDB.MaxCustomURLLength}),
                        PubDate datetime DEFAULT CURRENT_TIMESTAMP,
                        EditDate datetime DEFAULT CURRENT_TIMESTAMP
                    )`,
                });

                // create version paste
                // this is used to check if the server is outdated
                await SQL.QueryOBJ({
                    db: db,
                    query: "INSERT INTO Pastes VALUES (?, ?, ?, ?, ?)",
                    params: [
                        pack.version,
                        "", // an empty EditPassword essentially makes this paste uneditable without server access
                        //     this is because, by default, both the server and the client prevent paste passwords
                        //     that are less than 5 characters, so this isn't possible unless the server created it
                        "v", // a custom URL is required to be more than 2 characters by client and server, this is
                        //      basically just the same thing we did above with the EditPassword
                        new Date().toUTCString(), // PubDate
                        new Date().toUTCString(), // EditDate
                    ],
                    transaction: true,
                    use: "Prepare",
                });
            }
        })();
    }

    /**
     * @method ValidatePasteLengths
     * @description Validate the length of the fields in a paste
     *
     * @private
     * @static
     * @param {Paste} PasteInfo
     * @return {[boolean, string]} [okay, reason]
     * @memberof EntryDB
     */
    private static ValidatePasteLengths(PasteInfo: Paste): [boolean, string] {
        // validate lengths

        // check more than maximum
        if (PasteInfo.Content.length >= EntryDB.MaxContentLength)
            return [
                false,
                `Content must be less than ${EntryDB.MaxContentLength} characters!`,
            ];
        else if (PasteInfo.EditPassword.length >= EntryDB.MaxPasswordLength)
            return [
                false,
                `Edit password must be less than ${EntryDB.MaxPasswordLength} characters!`,
            ];
        else if (PasteInfo.CustomURL.length >= EntryDB.MaxCustomURLLength)
            return [
                false,
                `Custom URL must be less than ${EntryDB.MaxCustomURLLength} characters!`,
            ];
        // check less than minimum
        else if (PasteInfo.Content.length <= EntryDB.MinContentLength)
            return [
                false,
                `Content must be more than ${EntryDB.MinContentLength} characters!`,
            ];
        else if (PasteInfo.EditPassword.length <= EntryDB.MinPasswordLength)
            return [
                false,
                `Edit password must be more than ${EntryDB.MinPasswordLength} characters!`,
            ];
        else if (PasteInfo.CustomURL.length <= EntryDB.MinCustomURLLength)
            return [
                false,
                `Custom URL must be more than ${EntryDB.MinCustomURLLength} characters!`,
            ];

        return [true, ""];
    }

    /**
     * @method GetPasteFromURL
     *
     * @param {string} PasteURL
     * @return {(Promise<Paste | undefined>)}
     * @memberof EntryDB
     */
    public GetPasteFromURL(PasteURL: string): Promise<Paste | undefined> {
        return new Promise(async (resolve) => {
            // check if paste is from another server
            const server = PasteURL.split("@")[1];

            if (!server) {
                // ...everything after this assumes paste is NOT from another server, as the
                // logic for the paste being from another server SHOULD have been handled above!

                // get paste from local db
                const record = await SQL.QueryOBJ({
                    db: this.db,
                    query: "SELECT * FROM Pastes WHERE CustomURL = ?",
                    params: [PasteURL],
                    get: true,
                    use: "Prepare",
                });

                if (record) return resolve(record as Paste);
                else return resolve(undefined); // don't reject because we want this to be treated like an async function
            } else {
                // ...everything after this assumes paste IS from another server!

                // just send an /api/get request to the other server
                const request = fetch(
                    `http://${server}/api/get/${PasteURL.split("@")[0]}`
                );

                // handle bad
                request.catch(() => {
                    return resolve(undefined);
                });

                // get record
                const record = await request;

                // handle bad (again)
                if (record.headers.get("Content-Type") !== "application/json")
                    return resolve(undefined);

                // get body
                const json = (await record.json()) as Paste;
                json.HostServer = server;

                // return
                if (record.ok) return resolve(json);
                else return resolve(undefined);
            }
        });
    }

    /**
     * @method CreatePaste
     *
     * @param {Paste} PasteInfo
     * @return {Promise<[boolean, string, Paste]>}
     * @memberof EntryDB
     */
    public async CreatePaste(
        PasteInfo: Paste
    ): Promise<[boolean, string, Paste]> {
        // check custom url
        if (!PasteInfo.CustomURL.match(EntryDB.URLRegex))
            return [
                false,
                `Custom URL does not pass test: ${EntryDB.URLRegex}`,
                PasteInfo,
            ];

        // hash password
        PasteInfo.EditPassword = CreateHash(PasteInfo.EditPassword);

        // validate lengths
        const lengthsValid = EntryDB.ValidatePasteLengths(PasteInfo);
        if (!lengthsValid[0]) return [...lengthsValid, PasteInfo];

        // make sure a paste does not already exist with this custom URL
        if (await this.GetPasteFromURL(PasteInfo.CustomURL))
            return [
                false,
                "A paste with this custom URL already exists!",
                PasteInfo,
            ];

        // create paste
        await SQL.QueryOBJ({
            db: this.db,
            query: "INSERT INTO Pastes VALUES (?, ?, ?, ?, ?)",
            params: [
                ...Object.values(PasteInfo),
                new Date().toUTCString(), // PubDate
                new Date().toUTCString(), // EditDate
            ],
            transaction: true,
            use: "Prepare",
        });

        // return
        return [true, "Paste created!", PasteInfo];
    }

    /**
     * @method EditPaste
     *
     * @param {Paste} PasteInfo
     * @param {Paste} NewPasteInfo
     * @return {Promise<[boolean, string, Paste]>}
     * @memberof EntryDB
     */
    public async EditPaste(
        PasteInfo: Paste,
        NewPasteInfo: Paste
    ): Promise<[boolean, string, Paste]> {
        // check if paste is from another server
        const server = PasteInfo.CustomURL.split("@")[1];

        if (server) {
            // send request
            const [isBad, record] = await this.ForwardRequest(server, "edit", [
                `OldContent=${PasteInfo.Content}`,
                `OldEditPassword=${PasteInfo.EditPassword}`,
                `OldURL=${PasteInfo.CustomURL.split("@")[0]}`,
                // new
                `NewContent=${NewPasteInfo.Content}`,
                `NewEditPassword=${NewPasteInfo.EditPassword}`,
                `NewURL=${NewPasteInfo.CustomURL.split("@")[0]}`,
            ]);

            // check if promise rejected
            if (isBad) return [false, "Connection failed", NewPasteInfo];

            // return
            const err = this.GetErrorFromResponse(record);

            return [
                err === null || err === undefined,
                err || "Paste updated!",
                NewPasteInfo,
            ];
        }

        // ...everything after this assumes paste is NOT from another server, as the
        // logic for the paste being from another server SHOULD have been handled above!

        // hash passwords
        PasteInfo.EditPassword = CreateHash(PasteInfo.EditPassword);
        NewPasteInfo.EditPassword = CreateHash(NewPasteInfo.EditPassword);

        // validate lengths
        const lengthsValid = EntryDB.ValidatePasteLengths(NewPasteInfo);
        if (!lengthsValid[0]) return [...lengthsValid, NewPasteInfo];

        // make sure a paste exists
        const paste = await this.GetPasteFromURL(PasteInfo.CustomURL);
        if (!paste) return [false, "This paste does not exist!", NewPasteInfo];

        // check custom url
        if (!PasteInfo.CustomURL.match(EntryDB.URLRegex))
            return [
                false,
                `Custom URL does not pass test: ${EntryDB.URLRegex}`,
                PasteInfo,
            ];

        // validate password
        // don't use NewPasteInfo to get the password because NewPasteInfo will automatically have the old password
        // if a new password is not supplied. this is done on the server in API.EditPaste
        // paste is the version of the paste stored in the server, so the client cannot have messed with it
        // that means it is safe to compare with what we got from the client
        // ...comparing paste.EditPassword and PasteInfo.EditPassword because if we DID supply a new password,
        // PasteInfo will not have it, only NewPasteInfo will
        if (paste.EditPassword !== PasteInfo.EditPassword)
            return [false, "Invalid password!", NewPasteInfo];

        // update paste
        await SQL.QueryOBJ({
            db: this.db,
            query: "UPDATE Pastes SET (Content, EditPassword, CustomURL, PubDate, EditDate) = (?, ?, ?, ?, ?) WHERE CustomURL = ?",
            params: [...Object.values(NewPasteInfo), PasteInfo.CustomURL],
            use: "Prepare",
        });

        // return
        return [true, "Paste updated!", NewPasteInfo];
    }

    /**
     * @method DeletePaste
     *
     * @param {Paste} PasteInfo
     * @param {string} password
     * @return {Promise<[boolean, string, Paste]>}
     * @memberof EntryDB
     */
    public async DeletePaste(
        PasteInfo: Partial<Paste>,
        password: string
    ): Promise<[boolean, string, Partial<Paste>]> {
        if (!PasteInfo.CustomURL)
            return [false, "Missing CustomURL", PasteInfo];

        // check if paste is from another server
        const server = PasteInfo.CustomURL.split("@")[1];

        if (server) {
            // send request
            const [isBad, record] = await this.ForwardRequest(
                server,
                "delete",
                [
                    `CustomURL=${PasteInfo.CustomURL.split("@")[0]}`,
                    `password=${password}`,
                ]
            );

            // check if promise rejected
            if (isBad) return [false, "Connection failed", PasteInfo];

            // return
            const err = this.GetErrorFromResponse(record);
            return [
                err === null || err === undefined,
                err ? err : "Paste deleted!",
                PasteInfo,
            ];
        }

        // ...everything after this assumes paste is NOT from another server, as the
        // logic for the paste being from another server SHOULD have been handled above!

        // get paste
        const paste = await this.GetPasteFromURL(PasteInfo.CustomURL);

        // make sure a paste exists
        if (!paste) return [false, "This paste does not exist!", PasteInfo];

        // validate password
        if (CreateHash(password) !== paste.EditPassword)
            return [false, "Invalid password!", PasteInfo];

        // delete paste
        await SQL.QueryOBJ({
            db: this.db,
            query: "DELETE FROM Pastes WHERE CustomURL = ?",
            params: [PasteInfo.CustomURL],
            use: "Prepare",
        });

        // return
        return [true, "Paste deleted!", PasteInfo];
    }

    /**
     * @method ForwardRequest
     * @description Forward an endpoint request to another server
     *
     * @private
     * @param {string} server
     * @param {string} endpoint
     * @param {string[]} body
     * @return {Promise<[boolean, Response]>} [isBad, record]
     * @memberof EntryDB
     */
    private async ForwardRequest(
        server: string,
        endpoint: string,
        body: string[]
    ): Promise<[boolean, Response]> {
        // send request
        const request = fetch(`http://${server}/api/${endpoint}`, {
            body: body.join("&"),
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        // handle bad
        let isBad = false;
        request.catch(() => {
            isBad = true;
        });

        // get record
        const record = await request;

        // return
        return [isBad, record];
    }

    /**
     * @method GetErrorFromRequest
     * @description This is needed because depending on how fast your code is executed,
     * the request might resolve all the way to the redirect, or it might not
     *
     * @private
     * @param {Response} response
     * @return {(string | undefined | null)}
     * @memberof EntryDB
     */
    private GetErrorFromResponse(
        response: Response
    ): string | undefined | null {
        if (response.headers.get("Location")) {
            // get from location
            return new URLSearchParams(
                new URL(response.headers.get("Location")!).search
            ).get("err")!;
        } else {
            // get from url
            return new URLSearchParams(new URL(response.url).search).get("err");
        }
    }
}
