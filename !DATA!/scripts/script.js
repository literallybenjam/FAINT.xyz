/* jslint asi:true, browser:true */
/* global CSSRule */

var current_scroll_source = null;
var current_scroll_element = null;
var current_scroll_target = 0;
var current_scroll_velocity = 0;
var current_scroll_hash = "#";
var should_push_state = false;

function scroll() {
    var max_scroll = window.scrollMaxY;
    if (max_scroll === undefined) max_scroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var current_scroll_location = window.scrollY + window.innerHeight / 3;
    if (Math.abs(current_scroll_location - current_scroll_target) > 1 && max_scroll - window.scrollY >= current_scroll_velocity && -1 * window.scrollY <= current_scroll_velocity) {
        current_scroll_velocity = (current_scroll_velocity + (current_scroll_target - current_scroll_location) * 1023 / document.body.scrollHeight) / 2;
        if (current_scroll_velocity > 0) window.scrollBy(0, Math.ceil(current_scroll_velocity));
        else window.scrollBy(0, Math.floor(current_scroll_velocity));
        window.requestAnimationFrame(scroll);
    }
    else {
        window.scrollBy(0, current_scroll_target - current_scroll_location);
        current_scroll_velocity = 0;
        current_scroll_element.dispatchEvent(new CustomEvent("scrolledTo", {detail: {source: current_scroll_source}}));
        if (should_push_state) window.history.pushState(null, "", current_scroll_hash);
    }
}

function navHashFromLink(e) {
    if (document.getElementById(this.hash.substr(1))) {
        current_scroll_source = this;
        current_scroll_element = document.getElementById(this.hash.substr(1));
        current_scroll_target = current_scroll_element.getBoundingClientRect().top + window.scrollY;
        current_scroll_velocity = 0;
        current_scroll_hash = this.hash;
        should_push_state = true;
        window.requestAnimationFrame(scroll);
        e.preventDefault();
    }
}

function navHashFromLocation() {
    if (window.location.hash && document.getElementById(window.location.hash.substr(1))) {
        current_scroll_source = null;
        current_scroll_element = document.getElementById(window.location.hash.substr(1));
        current_scroll_target = current_scroll_element.getBoundingClientRect().top + window.scrollY;
        current_scroll_velocity = 0;
        current_scroll_hash = window.location.hash;
        should_push_state = false;
        window.requestAnimationFrame(scroll);
    }
}

function checkLinks() {
    if (!document.documentElement.lang) return;
    var links = document.getElementsByTagName("A");
    var i;
    var append;
    for (i = 0; i < links.length; i++) {
        if (links.item(i).hreflang && links.item(i).hreflang != document.documentElement.lang) {
            append = document.createElement("small");
            append.textContent = " [" + links.item(i).hreflang + "]";
            links.item(i).appendChild(append);
        }
    }
}

function readStyleSheet(ss) {
    var i;
    var styles = "";
    var imports = "";
    if (!ss.cssRules) return;
    for (i = 0; i < ss.cssRules.length; i++) {
        if (ss.cssRules.item(i).type === CSSRule.IMPORT_RULE) {
            if (ss.cssRules.item(i).href.indexOf(":") === -1 || ss.cssRules.item(i).href.substr(0, window.location.origin) === window.location.origin) {
                styles += readStyleSheet(ss.cssRules.item(i).styleSheet).styles;
                imports += readStyleSheet(ss.cssRules.item(i).styleSheet).imports;
            }
            else imports += ss.cssRules.item(i).cssText;
        }
        else styles += ss.cssRules.item(i).cssText;
    }
    return {styles: styles, imports: imports};
}

function getHTML() {
    var i;
    var s = "<!DOCTYPE html>\n<!--  " + document.title + ", originally located at " + window.location.href + '  -->\n<html lang="' + document.documentElement.lang + '">\n    <head>\n';
    for (i = 0; i < document.head.children.length; i++) {
        switch (document.head.children.item(i).tagName) {
            case "LINK":
                if (document.head.children.item(i).type == "text/css") s += "        <style>" + readStyleSheet(document.head.children.item(i).sheet).imports + readStyleSheet(document.head.children.item(i).sheet).styles + "</style>\n";
                break;

            case "SCRIPT":
                s += "        <!--  script omitted  -->\n";
                break;

            default:
                s += "        " + document.head.children.item(i).outerHTML + "\n";
                break;
        }
    }
    s += "    </head>\n    " + document.body.outerHTML + "\n</html>";
    return s;
}

function exportNode(node) {
    var s = "";
    var i;
    switch (node.nodeType) {

        case Node.TEXT_NODE:
            s = node.textContent.replace(/\s+/, " ");
            break;

        case Node.ELEMENT_NODE:
            if (node.classList.contains("export-link") || node.classList.contains("export-hidden")) break;
            for (i = 0; i < node.childNodes.length; i++) {
                s += exportNode(node.childNodes.item(i))
            }
            switch (node.tagName) {

                case "A":
                    s += " [" + node.href + "]";
                    break;

                case "ASIDE":
                    s = "\n[[" + s + "]]\n";
                    break;

                case "B":
                    s = "#" + s.replace(/\s+/g, "-");
                    break;

                case "BLOCKQUOTE":
                    s = ("\n" + s.replace(/\s+$/, "").replace(/^\s+/, "")).replace(/\s*\n\s*/g, "\n").replace(/\n/g, "\n > ");
                    break;

                case "BR":
                    s = "\n";
                    break;

                case "CODE":
                    s = "'" + s.trim() + "'";
                    break;

                case "DEL":
                    s = "[deleted]";
                    break;

                case "DFN":
                    s = "_" + s.trim() + "_";
                    break;

                case "DT":
                    s = "\n" + s + ": ";
                    break;

                case "EM":
                    s = "~" + s.trim() + "~";
                    break;

                case "FIGCAPTION":
                    s = "\n– " + s + "\n";
                    break;

                case "FIGURE":
                    s = "\n" + s + "\n";
                    break;

                case "H1":
                    s = "\n" + s.toLocaleUpperCase() + "\n";
                    break;

                case "H2":
                    s = "\n~ " + s + " ~\n";
                    break;

                case "H3":
                    s = "\n> " + s + ":\n";
                    break;

                case "H4":
                    s = "\n>> " + s + ":\n";
                    break;

                case "H5":
                    s = "\n>>> " + s + ":\n";
                    break;

                case "H6":
                    s = "\n>>>> " + s + ":\n";
                    break;

                case "HR":
                    s = "\n* * *\n";
                    break;

                case "I":
                    s = "'" + s.trim() + "'";
                    break;

                case "IFRAME":
                    s = "\n[" + node.src + "]\n";
                    break;

                case "IMG":
                    if (node.alt) s = "[image, " + node.alt + "]";
                    else s = "[image]";
                    break;

                case "INS":
                    s = "_" + s.replace(/\s+/g, "_") + "_";
                    break;

                case "LI":
                    if (node.parentElement.tagName === "OL") {
                        for (i = 0; i < node.parentElement.children.length; i++) {
                            if (node.parentElement.children.item(i) === node) break;
                        }
                        s = "\n" + (i + 1) + ". " + s + "\n";
                    }
                    else s = "\n· " + s + "\n";
                    break;

                case "P":
                    if (window.getComputedStyle(node, "::before").getPropertyValue("content") == '"¶"') s = "\n¶ " + s + "\n";
                    else if (window.getComputedStyle(node, "::after").getPropertyValue("content") == "no-close-quote") s = "\n“" + s + "\n";
                    else if (window.getComputedStyle(node, "::after").getPropertyValue("content") == "close-quote") s = "\n“" + s + "”\n";
                    else s = "\n" + s + "\n";
                    break;

                case "Q":
                    s = "“" + s + "”";
                    break;

                case "SMALL":
                    s = "((" + s.trim() + "))";
                    break;

                case "S":
                    s = "-" + s.replace(/\s+/, "-") + "-";
                    break;

                case "STRONG":
                    s = s.toLocaleUpperCase();
                    break;

                case "SUB":
                    s = "_[" + s.trim() + "]";
                    break;

                case "SUP":
                    s = "^[" + s.trim() + "]";
                    break;
            }
            break;

        default:
            break;

    }
    return s.replace(/ +/g, " ").replace(/ *\n */g, "\n").replace(/\n+/g, "\n");
}

function navWalk(walker) {
    var s = "<ol>";
    do {
        if (!walker.currentNode.children.length || (walker.currentNode.firstElementChild.tagName.toUpperCase() != "H1" && walker.currentNode.firstElementChild.tagName.toUpperCase() != "H2" && walker.currentNode.firstElementChild.tagName.toUpperCase() != "H3" && walker.currentNode.firstElementChild.tagName.toUpperCase() != "H4" && walker.currentNode.firstElementChild.tagName.toUpperCase() != "H5" && walker.currentNode.firstElementChild.tagName.toUpperCase() != "H6")) continue;
        s += "<li>";
        if (walker.currentNode.id) s += '<a href="#' + walker.currentNode.id + '">';
        s += walker.currentNode.firstElementChild.textContent;
        if (walker.currentNode.id) s += '</a>';
        if (walker.firstChild()) {
            s += navWalk(walker);
            walker.parentNode();
        }
        s += "</li>";
    }
    while (walker.nextSibling());
    s += "</ol>";
    if (s !== "<ol></ol>") return s;
    return "";
}

function navInit() {
    var walker = document.createTreeWalker(document.getElementsByTagName("MAIN").item(0), NodeFilter.SHOW_ELEMENT, function(node) {
        if (node.nodeName.toUpperCase() === "SECTION") return NodeFilter.FILTER_ACCEPT; else return NodeFilter.FILTER_SKIP;
    });
    if (walker.firstChild()) {
        var nav = document.createElement("NAV");
        nav.innerHTML = navWalk(walker) + '<hr><a href="/">&lt;-- back to <u>FAINT.xyz</u></a>';
        document.body.appendChild(nav);
    }
}

function exportInit() {
    if (document.documentElement.dataset.noDownload || !document.getElementsByTagName("MAIN")) return;
    var plaintext = exportNode(document.getElementsByTagName("MAIN").item(0)).trim()
    var html = getHTML();
    var footer = document.createElement("FOOTER");
    footer.innerHTML = 'download: <a href="data:text/plain;charset=utf-8,' + encodeURIComponent(plaintext) + '" target="_blank">plain text</a> / <a href="data:text/html;charset=utf-8,' + encodeURIComponent(html) + '" target="_blank">html</a>';
    document.getElementsByTagName("MAIN").item(0).appendChild(footer);
    document.styleSheets.item(0).insertRule("@media print{main > footer:last-child {display: none;}}", document.styleSheets.item(0).cssRules.length);
}

function init() {
    checkLinks();
    exportInit();
    navInit();
    var hashLinks = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < hashLinks.length; i++) {
        hashLinks.item(i).addEventListener("click", navHashFromLink, false);
    }
    navHashFromLocation();
}

document.addEventListener("DOMContentLoaded", init, false);
window.addEventListener("popstate", navHashFromLocation, false);
