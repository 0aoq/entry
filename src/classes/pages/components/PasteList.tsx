import { Paste } from "../../db/EntryDB";
import { CreateHash } from "../../db/Hash";

export default function PasteList(props: {
    Pastes: Paste[];
    Selector?: string;
    ShowDelete?: boolean;
    AdminPassword?: string;
}) {
    return (
        <div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                }}
            >
                {(props.Selector && (
                    <>
                        <form
                            action="/admin/manage-pastes"
                            method={"POST"}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                flexWrap: "wrap",
                            }}
                        >
                            <input
                                type="hidden"
                                required
                                name="AdminPassword"
                                value={props.AdminPassword}
                            />

                            <input
                                required
                                name={"sql"}
                                placeholder={"Query"}
                                value={props.Selector}
                                style={{
                                    background: "var(--background-surface)",
                                }}
                            />

                            <button>Query</button>
                        </form>
                    </>
                )) || <span></span>}

                <div
                    style={{
                        display: "flex",
                        gap: "0.5rem",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    {props.ShowDelete && props.AdminPassword && (
                        <form action="/admin/api/mass-delete" method={"POST"}>
                            <input
                                type="hidden"
                                required
                                name="AdminPassword"
                                value={props.AdminPassword}
                            />

                            <input
                                type="hidden"
                                required
                                name={"pastes"}
                                value={JSON.stringify(props.Pastes)}
                            />

                            <button>Delete Results</button>
                        </form>
                    )}

                    <span>{props.Pastes.length} results</span>
                </div>
            </div>

            <div
                style={{
                    maxWidth: "100vw",
                    overflow: "auto",
                }}
            >
                <table
                    class={"force-full"}
                    style={{
                        width: "100%",
                    }}
                >
                    <thead>
                        <tr>
                            <th>Custom URL</th>
                            <th>Publish Date</th>
                            <th>Edit Date</th>
                            <th>Private</th>
                            <th>Editable</th>
                            <th>Open</th>
                            {props.ShowDelete && <th>Delete</th>}
                        </tr>
                    </thead>

                    <tbody>
                        {props.Pastes.map((paste) => {
                            return (
                                <tr>
                                    <td
                                        title={paste.CustomURL}
                                        style={{
                                            maxWidth: "5rem",
                                            textOverflow: "ellipsis",
                                            overflow: "hidden",
                                            overflowWrap: "normal",
                                            wordBreak: "normal",
                                        }}
                                    >
                                        {paste.CustomURL.split(":")[0]}
                                    </td>

                                    <td>{paste.PubDate}</td>
                                    <td>{paste.EditDate}</td>
                                    <td>
                                        {paste.ViewPassword !== ""
                                            ? "yes"
                                            : "no"}
                                    </td>
                                    <td>
                                        {paste.EditPassword !== CreateHash("") &&
                                        paste.GroupName !== "server" // server pastes cannot be edited
                                            ? "yes"
                                            : "no"}
                                    </td>

                                    <td>
                                        <a
                                            href={`/${paste.CustomURL}`}
                                            target="_blank"
                                        >
                                            View Paste
                                        </a>
                                    </td>

                                    {props.ShowDelete && (
                                        <td>
                                            <form
                                                action="/admin/api/delete"
                                                method={"POST"}
                                            >
                                                <input
                                                    type="hidden"
                                                    required
                                                    name="AdminPassword"
                                                    value={props.AdminPassword}
                                                />

                                                <input
                                                    type="hidden"
                                                    required
                                                    name={"CustomURL"}
                                                    value={paste.CustomURL}
                                                />

                                                <button>Delete Paste</button>
                                            </form>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}