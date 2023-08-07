import EntryDB, { Paste } from "../../../db/EntryDB";

export default function DecryptionForm(props: {
    paste: Paste;
    urlName?: string;
    isEdit?: boolean;
}) {
    return (
        <>
            {
                // we don't need to send a POST request to /api/decrypt here,
                // because the decryption is handled above! all we want this
                // form to do is the default thing (where it puts inputs in the url)
            }
            <form
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                    flexWrap: "wrap",
                }}
                action={`/paste/dec/${props.paste.CustomURL}`}
                method={"POST"}
            >
                <button>Decrypt</button>

                {props.isEdit && (
                    <input type={"hidden"} name={"mode"} value={"edit"} required />
                )}

                <input
                    type="hidden"
                    required
                    name={props.urlName || "CustomURL"}
                    value={props.paste.CustomURL}
                />

                <input
                    type="text"
                    name={"ViewPassword"}
                    placeholder={"View password"}
                    minLength={EntryDB.MinPasswordLength}
                    maxLength={EntryDB.MaxPasswordLength}
                    required
                />
            </form>
        </>
    );
}