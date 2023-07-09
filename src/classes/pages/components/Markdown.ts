import { marked } from "marked";
import hljs from "highlight.js";

/**
 * @function ParseMarkdown
 *
 * @param {string} content
 * @return {string}
 */
export function ParseMarkdown(content: string): string {
    // we're going to use this on the server too!
    // update content to allow arrow element alignment, marked doesn't normally do this because it isn't in the markdown spec
    content = content.replaceAll(
        // -> <- (center)
        /^(\-\>)(.*?)(\<\-)\s*$/gm,
        '<p style="text-align: center;">$2</p>'
    );

    content = content.replaceAll(
        // -> -> (right)
        /^(\-\>)(.*?)(\-\>)\s*$/gm,
        '<p style="text-align: right;">$2</p>'
    );

    // update content to allow highlighting
    content = content.replaceAll(
        /(\=\=)(.*?)(\=\=)/g,
        '<span class="highlight">$2</span>'
    );

    // update content to allow notes/warnings
    content = content.replaceAll(
        /^(\!\!\!)\s(?<TYPE>.*?)\s(?<TITLE>.*?)\n(?<CONTENT>.*?)$/gm,
        `<div class="mdnote note-$2">
            <b class="mdnote-title">$3</b>
            <p>$4</p>
        </div>`
    );

    content = content.replaceAll(
        // only title match
        /^(\!\!\!)\s(?<TYPE>.*?)\s(?<TITLE>.*?)$/gm,
        '<div class="mdnote note-$2"><b class="mdnote-title">$3</b></div>'
    );

    // we have to do this ourselves because the next step would make it not work!
    content = content.replaceAll(
        /(\*\*\*)(.*?)(\*\*\*)/g,
        "<strong><em>$2</em></strong>"
    );

    // replace *** with <hr /> (rentry uses *** for hr, that's dumb)
    content = content.replaceAll("***", "<hr />");

    // remove scripts, on[...] attributes and <link> elements

    // ...attributes
    content = content.replaceAll(/(on)(.*)\=(.*)\"/g, "");
    content = content.replaceAll(/(href)\=(.*)\"/g, "");

    // ...elements
    content = content.replaceAll(/(<script.*>)(.*?)(<\/script>)/gs, "");
    content = content.replaceAll(/(<script.*>)/gs, ""); // the above thing does not match the void <script /> element,
    //                                                     making the following work:
    //                                                         <script />alert(1)
    //                                                     this regex fixes that

    content = content.replaceAll(/(<link.*>)/gs, "");
    content = content.replaceAll(/(<meta.*>)/gs, "");

    content = content.replaceAll(/(<style.*>)(.*?)(<\/style>)/gs, "");
    content = content.replaceAll(/(<style.*>)/gs, "");

    // parse content with marked and return
    return marked.parse(content, {
        mangle: false,
        gfm: true,
        breaks: true,
        silent: true,
    });
}

/**
 * @function FixMarkdown
 *
 * @export
 * @param {HTMLElement} element
 */
export function FixMarkdown(element: HTMLElement) {
    // run marked on all child elements of the preview tab
    function SelectRule(rule: string) {
        for (const _element of element.querySelectorAll(
            rule
        ) as any as HTMLElement[]) {
            _element.innerHTML = ParseMarkdown(_element.innerText);
        }
    }

    // essentially, running this function with a given nodeName will select all
    // of those elements and parse any markdown inside of them
    SelectRule('p[style="text-align: center;"]'); // fix elements that we changed
    SelectRule('p[style="text-align: right;"]'); // fix elements that we changed

    // fix #text elements (those should be paragraphs)
    for (const _element of element.childNodes as any as HTMLElement[])
        if (_element.nodeName === "#text") {
            // sometimes, marked will miss a node and just create a #text node
            // we need to turn this into a normal paragraph node
            const paragraph = document.createElement("p");
            paragraph.innerHTML = ParseMarkdown(_element.textContent as string);

            _element.replaceWith(paragraph);
        } else continue;

    // highlight
    hljs.highlightAll();
}

/**
 * @function HandleCustomElements
 *
 * @export
 */
export function HandleCustomElements() {
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
}

// default export
export default {
    ParseMarkdown,
    FixMarkdown,
    HandleCustomElements,
};
