import EntryDB from "../../../db/EntryDB";

export default function SearchForm(props: {
    query?: string;
    alwaysCenter?: boolean;
}) {
    return (
        <search
            class={`flex ${
                props.alwaysCenter ? "justify-center" : "mobile:justify-center"
            }`}
        >
            <form
                class={"flex g-4 justify-center"}
                style={{
                    maxWidth: "95%",
                }}
            >
                <input
                    type="text"
                    name={"q"}
                    id={"q"}
                    placeholder={"Search all pastes"}
                    minLength={EntryDB.MinCustomURLLength}
                    maxLength={EntryDB.MaxCustomURLLength}
                    autocomplete={"off"}
                    value={props.query || ""}
                    required
                    class={"round"}
                    style={{
                        width: "65%",
                    }}
                />

                <button
                    style={{
                        width: "35%",
                    }}
                    class={"round"}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        width="18"
                        height="18"
                        aria-label={"Magnifying Glass Symbol"}
                    >
                        <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"></path>
                    </svg>{" "}
                    Search
                </button>
            </form>
        </search>
    );
}
