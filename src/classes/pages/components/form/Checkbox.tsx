export default function Checkbox(props: {
    name: string;
    title?: string;
    checked?: boolean;
    disabled?: boolean;
    label?: boolean;
    secondary?: boolean;
    changed?: (event: Event<HTMLElement>) => void;
    round?: boolean;
}) {
    return (
        <label
            className={`checkbox-container${props.secondary ? " secondary" : ""}${
                props.disabled ? " disabled" : ""
            }`}
            for={props.name}
            title={props.title || "Checkbox"}
            style={{
                width: props.label ? "fit-content" : "2.5rem",
                borderRadius: props.round ? "0.4rem" : "",
            }}
            onChange={props.changed}
        >
            <input
                type="checkbox"
                name={props.name}
                id={props.name}
                checked={props.checked || false}
                value={"true"}
                disabled={props.disabled}
            />

            <div className="check">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    width="18"
                    height="18"
                    aria-label={"Check Mark Symbol"}
                    style={{
                        fill: "var(--green)",
                    }}
                >
                    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
                </svg>
            </div>

            <div className="x">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    width="18"
                    height="18"
                    aria-label={"X Symbol"}
                    style={{
                        fill: "var(--red3)",
                    }}
                >
                    <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path>
                </svg>
            </div>

            {props.label && <span class={"checkbox-label"}>{props.title}</span>}
        </label>
    );
}
