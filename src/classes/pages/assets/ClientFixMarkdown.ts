// yeah, so this didn't want to work on client because when we try to use it on the client,
// FixMarkdown will not be defined because the script will have already been minified
// this is the code run to fix the markdown when viewing a paste

import hljs from "highlight.js";

/**
 * @function HandleCustomElements
 * @export
 */
export function HandleCustomElements() {
    // treat rentro.co links as links to federared entry servers
    for (let anchor of document.body.querySelectorAll(
        "a"
    ) as any as HTMLAnchorElement[]) {
        anchor.href = anchor.href.replace("https://rentry.org", "https://rentry.co");
        if (!anchor.href.split("https://rentry.co/")[1]) continue;
        else
            anchor.href = `/${anchor.href.split("https://rentry.co/")[1]}:rentry.co`;
    }

    // treat sentrytwo.com links as federated entry servers
    for (let anchor of document.body.querySelectorAll(
        "a"
    ) as any as HTMLAnchorElement[]) {
        anchor.href = anchor.href.replace(
            "https://www.sentrytwo.com",
            "https://sentrytwo.com"
        );
        if (!anchor.href.split("https://sentrytwo.com/")[1]) continue;
        else
            anchor.href = `/${
                anchor.href.split("https://sentrytwo.com/")[1]
            }:sentrytwo.com`;
    }

    // handle style elements
    let style = "";

    // ...theme customization
    const hue = document.querySelector("#editor-tab-preview hue") as HTMLElement;
    const sat = document.querySelector("#editor-tab-preview sat") as HTMLElement;
    const lit = document.querySelector("#editor-tab-preview lit") as HTMLElement;

    if (hue) style += `--base-hue: ${hue.innerText};`;
    if (sat) style += `--base-sat: ${sat.innerText};`;
    if (lit) style += `--base-lit: ${lit.innerText};`;

    // ...set style attribute
    document.documentElement.setAttribute("style", style);

    // handle class elements
    const themes = document.querySelectorAll(
        "#editor-tab-preview theme"
    ) as any as HTMLElement[];

    if (themes.length > 0) {
        document.documentElement.classList.value = ""; // reset, we don't need to check for
        //                                                light theme, dark will be removed by this

        for (let theme of themes) {
            if (theme.innerText === "dark")
                document.documentElement.classList.add("dark-theme");
            else if (theme.innerText === "purple")
                document.documentElement.classList.add("purple-theme", "dark-theme");
            else if (theme.innerText === "blue")
                document.documentElement.classList.add("blue-theme", "dark-theme");
        }
    }
}

/**
 * @function ClientFixMarkdown
 *
 * @export
 * @param {boolean} [DoFix=true]
 */
export default async function ClientFixMarkdown(DoFix: boolean = true) {
    HandleCustomElements();
    hljs.highlightAll();
}
