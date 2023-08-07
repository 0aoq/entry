/**
 * @file Handle Admin endpoints
 * @name Admin.tsx
 * @license MIT
 */

import Honeybee, { Endpoint, Renderer } from "honeybee";

import { VerifyContentType, db, DefaultHeaders, PageHeaders } from "./API";
import { CreateHash, Decrypt } from "../db/Hash";
import EntryDB from "../db/EntryDB";

import PasteList from "./components/PasteList";
import Footer from "./components/Footer";

import { Config } from "../..";
import Checkbox from "./components/form/Checkbox";
let config: Config;

/**
 * @function AdminNav
 *
 * @param {{ active: string }} props
 * @return {*}
 */
function AdminNav(props: { active: string; pass: string }): any {
    return (
        <>
            <h1
                style={{
                    width: "100%",
                }}
            >
                {config.name} Admin
            </h1>

            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "0.4rem",
                    flexWrap: "wrap",
                }}
            >
                <form action="/admin/manage-pastes" method="POST">
                    <input
                        type="hidden"
                        required
                        name="AdminPassword"
                        value={props.pass}
                    />

                    <button class={props.active === "pastes" ? "active" : ""}>
                        Manage Pastes
                    </button>
                </form>

                <form action="/admin/export" method="POST">
                    <input
                        type="hidden"
                        required
                        name="AdminPassword"
                        value={props.pass}
                    />

                    <button class={props.active === "export" ? "active" : ""}>
                        Export/Import
                    </button>
                </form>

                <a href="https://codeberg.org/hkau/entry">
                    <button>View Source</button>
                </a>
            </div>

            <style
                dangerouslySetInnerHTML={{
                    __html: `button { background: var(--background-surface); }
                    button.active { box-shadow: 0 0 1px var(--blue2); }`,
                }}
            />

            <hr />
        </>
    );
}

/**
 * @export
 * @class Login
 * @implements {Endpoint}
 */
export class Login implements Endpoint {
    public async request(request: Request): Promise<Response> {
        if (!config) config = (await EntryDB.GetConfig()) as Config;

        // we aren't actually using a login system, it's just a form for the configured
        // server admin password

        return new Response(
            Renderer.Render(
                <>
                    <main>
                        <form
                            action="/admin/manage-pastes"
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                            method={"POST"}
                        >
                            <input
                                type="password"
                                name={"AdminPassword"}
                                required
                                placeholder={"Password"}
                            />

                            <button>Go</button>
                        </form>

                        <Footer />
                    </main>
                </>,
                <>
                    <title>{config.name} Admin</title>
                </>
            ),
            {
                headers: {
                    ...DefaultHeaders,
                    "Content-Type": "text/html",
                },
            }
        );
    }
}

/**
 * @export
 * @class ManagePastes
 * @implements {Endpoint}
 */
export class ManagePastes implements Endpoint {
    public async request(request: Request): Promise<Response> {
        if (!config) config = (await EntryDB.GetConfig()) as Config;

        // verify content type
        const WrongType = VerifyContentType(
            request,
            "application/x-www-form-urlencoded"
        );

        if (WrongType) return WrongType;

        // get request body
        const body = Honeybee.FormDataToJSON(await request.formData()) as any;

        // validate password
        if (!body.AdminPassword || body.AdminPassword !== config!.admin)
            return new Login().request(request);

        // fetch all pastes
        const pastes = await db.GetAllPastes(true, false, body.sql);

        // return
        return new Response(
            Renderer.Render(
                <>
                    <main>
                        <div
                            className="tab-container editor-tab"
                            style={{
                                height: "min-content",
                                maxHeight: "85vh",
                            }}
                        >
                            <AdminNav active="pastes" pass={body.AdminPassword} />

                            <p>
                                <b>Direct SQL</b>
                            </p>

                            <div>
                                <form
                                    action="/admin/api/sql"
                                    method={"POST"}
                                    target={"_blank"}
                                    style={{
                                        display: "flex",
                                        gap: "0.5rem",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <input
                                        type="hidden"
                                        required
                                        name="AdminPassword"
                                        value={body.AdminPassword}
                                    />

                                    <input
                                        type="text"
                                        name={"sql"}
                                        id={"sql"}
                                        placeholder={
                                            "SELECT * FROM Pastes LIMIT 100"
                                        }
                                        className="secondary"
                                        autoComplete={"off"}
                                        style={{
                                            width: "40rem",
                                        }}
                                    />

                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "0.5rem",
                                            flexWrap: "wrap",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Checkbox
                                            name="get"
                                            title="get"
                                            label={true}
                                            secondary={true}
                                        />

                                        <Checkbox
                                            name="all"
                                            title="all"
                                            label={true}
                                            secondary={true}
                                        />

                                        <Checkbox
                                            name="cache"
                                            title="cache"
                                            label={true}
                                            secondary={true}
                                            disabled
                                        />

                                        <button>Query</button>
                                    </div>
                                </form>
                            </div>

                            <hr />

                            <p>
                                <b>Paste Search</b>
                            </p>

                            <PasteList
                                Pastes={pastes}
                                ShowDelete={true}
                                AdminPassword={body.AdminPassword}
                                Selector={
                                    body.sql || "CustomURL IS NOT NULL LIMIT 1000"
                                }
                            />
                        </div>

                        <Footer />
                    </main>
                </>,
                <>
                    <title>{config.name} Admin</title>
                </>
            ),
            {
                headers: {
                    ...PageHeaders,
                    "Content-Type": "text/html",
                },
            }
        );
    }
}

/**
 * @export
 * @class QueryPastesPage
 * @implements {Endpoint}
 */
export class QueryPastesPage implements Endpoint {
    public async request(request: Request): Promise<Response> {
        // verify content type
        const WrongType = VerifyContentType(
            request,
            "application/x-www-form-urlencoded"
        );

        if (WrongType) return WrongType;

        // get request body
        const body = Honeybee.FormDataToJSON(await request.formData()) as any;

        // validate password
        if (!body.AdminPassword || body.AdminPassword !== config!.admin || !body.sql)
            return new Login().request(request);

        // get pastes
        const pastes = await db.GetAllPastes(true, false, body.sql);

        // return
        return new Response(
            Renderer.Render(
                <>
                    <main>
                        <div
                            className="tab-container editor-tab"
                            style={{
                                height: "min-content",
                                maxHeight: "85vh",
                            }}
                        >
                            <AdminNav active="pastes" pass={body.AdminPassword} />

                            <PasteList
                                Pastes={pastes}
                                ShowDelete={true}
                                AdminPassword={body.AdminPassword}
                            />
                        </div>

                        <Footer />
                    </main>

                    <style
                        dangerouslySetInnerHTML={{
                            __html: `form button { margin: auto; }`,
                        }}
                    />
                </>,
                <>
                    <title>{config.name} Admin</title>
                </>
            ),
            {
                headers: {
                    ...PageHeaders,
                    "Content-Type": "text/html",
                },
            }
        );
    }
}

/**
 * @export
 * @class APIDeletePaste
 * @implements {Endpoint}
 */
export class APIDeletePaste implements Endpoint {
    public async request(request: Request): Promise<Response> {
        // this is the same code as API.DeletePaste, but it requires body.AdminPassword
        // NOTE: API.DeletePaste CAN take the admin password in the normal "password" field,
        //       and it will still work the same!!!
        // this endpoint is just use to redirect to /admin/login instead of /

        // verify content type
        const WrongType = VerifyContentType(
            request,
            "application/x-www-form-urlencoded"
        );

        if (WrongType) return WrongType;

        // get request body
        const body = Honeybee.FormDataToJSON(await request.formData()) as any;

        // delete paste
        const result = await db.DeletePaste(
            {
                CustomURL: body.CustomURL,
            },
            body.AdminPassword
        );

        // return
        return new Response(JSON.stringify(result), {
            status: 302,
            headers: {
                ...DefaultHeaders,
                "Content-Type": "application/json",
                Location:
                    result[0] === true
                        ? // if successful, redirect to home
                          `/admin/login`
                        : // otherwise, show error message
                          `/?err=${encodeURIComponent(result[1])}&mode=edit&OldURL=${
                              result[2].CustomURL
                          }`,
            },
        });
    }
}

/**
 * @export
 * @class ExportPastesPage
 * @implements {Endpoint}
 */
export class ExportPastesPage implements Endpoint {
    public async request(request: Request): Promise<Response> {
        if (!config) config = (await EntryDB.GetConfig()) as Config;

        // verify content type
        const WrongType = VerifyContentType(
            request,
            "application/x-www-form-urlencoded"
        );

        if (WrongType) return WrongType;

        // get request body
        const body = Honeybee.FormDataToJSON(await request.formData()) as any;

        // validate password
        if (!body.AdminPassword || body.AdminPassword !== config!.admin)
            return new Login().request(request);

        // return
        return new Response(
            Renderer.Render(
                <>
                    <main>
                        <div className="tab-container editor-tab">
                            <AdminNav active="export" pass={body.AdminPassword} />

                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                }}
                            >
                                <form action="/admin/api/export" method="POST">
                                    <input
                                        type="hidden"
                                        required
                                        name="AdminPassword"
                                        value={body.AdminPassword}
                                    />

                                    <button>Export Pastes</button>
                                </form>

                                <hr style={{ width: "100%" }} />

                                <form
                                    action="/admin/api/import"
                                    encType={"multipart/form-data"}
                                    method="POST"
                                    style={{
                                        display: "flex",
                                        gap: "0.4rem",
                                        flexWrap: "wrap",
                                        alignItems: "center",
                                    }}
                                >
                                    <input
                                        type="hidden"
                                        required
                                        name="AdminPassword"
                                        value={body.AdminPassword}
                                    />

                                    <input
                                        type="file"
                                        name={"pastes"}
                                        required
                                        placeholder={"Exported Pastes JSON"}
                                        minLength={2}
                                    />

                                    <button>Import Pastes</button>
                                </form>
                            </div>
                        </div>

                        <Footer />
                    </main>

                    <style
                        dangerouslySetInnerHTML={{
                            __html: `input { background: var(--background-surface); }`,
                        }}
                    />
                </>,
                <>
                    <title>{config.name} Admin</title>
                </>
            ),
            {
                headers: {
                    ...PageHeaders,
                    "Content-Type": "text/html",
                },
            }
        );
    }
}

/**
 * @export
 * @class APIExport
 * @implements {Endpoint}
 */
export class APIExport implements Endpoint {
    public async request(request: Request): Promise<Response> {
        // verify content type
        const WrongType = VerifyContentType(
            request,
            "application/x-www-form-urlencoded"
        );

        if (WrongType) return WrongType;

        // get request body
        const body = Honeybee.FormDataToJSON(await request.formData()) as any;

        // validate password
        if (!body.AdminPassword || body.AdminPassword !== config!.admin)
            return new Login().request(request);

        // get pastes
        const _export = await db.GetAllPastes(true, false, "CustomURL IS NOT NULL");

        // decrypt encrypted pastes
        // if paste is encrypted, decrypt
        // ...otherwise the created paste will decrypt to an encrypted value!!!
        for (let paste of _export)
            if (paste.ViewPassword) {
                // get encryption information
                const enc = await db.GetEncryptionInfo(
                    paste.ViewPassword,
                    paste.CustomURL
                );

                // decrypt
                paste.Content = Decrypt(
                    paste.Content,
                    enc[1].key,
                    enc[1].iv,
                    enc[1].auth
                )!;
            } else continue;

        // return
        return new Response(JSON.stringify(_export), {
            headers: {
                ...DefaultHeaders,
                "Content-Type": "text/plain",
                "Content-Disposition": `attachment; filename="entry-${new Date().toISOString()}.json"`,
            },
        });
    }
}

/**
 * @export
 * @class APIImport
 * @implements {Endpoint}
 */
export class APIImport implements Endpoint {
    public async request(request: Request): Promise<Response> {
        // verify content type
        const WrongType = VerifyContentType(request, "multipart/form-data");

        if (
            WrongType &&
            !(request.headers.get("content-type") || "").includes(
                "multipart/form-data"
            )
        )
            return WrongType;

        // get request body
        const body = Honeybee.FormDataToJSON(await request.formData()) as any;
        body.pastes = await (body.pastes as Blob).text();

        // validate password
        if (!body.AdminPassword || body.AdminPassword !== config!.admin)
            return new Login().request(request);

        // get pastes
        const output = await db.ImportPastes(JSON.parse(body.pastes) || []);

        // return
        return new Response(JSON.stringify(output), {
            headers: {
                ...DefaultHeaders,
                "Content-Type": "application/json",
            },
        });
    }
}

/**
 * @export
 * @class APIMassDelete
 * @implements {Endpoint}
 */
export class APIMassDelete implements Endpoint {
    public async request(request: Request): Promise<Response> {
        // verify content type
        const WrongType = VerifyContentType(
            request,
            "application/x-www-form-urlencoded"
        );

        if (WrongType) return WrongType;

        // get request body
        const body = Honeybee.FormDataToJSON(await request.formData()) as any;

        // validate password
        if (!body.AdminPassword || body.AdminPassword !== config!.admin)
            return new Login().request(request);

        // get pastes
        const output = await db.DeletePastes(
            JSON.parse(body.pastes),
            body.AdminPassword
        );

        // return
        return new Response(JSON.stringify(output), {
            headers: {
                ...DefaultHeaders,
                "Content-Type": "application/json",
            },
        });
    }
}

/**
 * @export
 * @class APISQL
 * @implements {Endpoint}
 */
export class APISQL implements Endpoint {
    public async request(request: Request): Promise<Response> {
        // verify content type
        const WrongType = VerifyContentType(
            request,
            "application/x-www-form-urlencoded"
        );

        if (WrongType) return WrongType;

        // get request body
        const body = Honeybee.FormDataToJSON(await request.formData()) as any;

        // validate password
        if (!body.AdminPassword || body.AdminPassword !== config!.admin)
            return new Login().request(request);

        // run query
        const output = await db.DirectSQL(
            body.sql,
            body.get !== undefined,
            body.all !== undefined,
            body.AdminPassword
        );

        // return
        return new Response(JSON.stringify(output), {
            headers: {
                ...DefaultHeaders,
                "Content-Type": "application/json",
            },
        });
    }
}

// default export
export default {
    Login,
    ManagePastes,
    APIDeletePaste,
    ExportPastesPage,
    APIExport,
    APIImport,
    APIMassDelete,
    APISQL,
};