/* jslint asi:true, browser:true */
/* global CSSRule */
/* global Export */

var current_scroll_source = null;
var current_scroll_element = null;
var current_scroll_target = 0;
var current_scroll_velocity = 0;
var current_scroll_hash = "#";
var should_push_state = false;

var scripts = {
    "export-js": 1
}
var scripts_loaded = 0;
var MAX_SCRIPTS = 1;

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
    var nav;
    if (walker.firstChild()) {
        nav = document.createElement("NAV");
        nav.innerHTML = navWalk(walker) + '<hr><a href="/"><u>FAINT.xyz</u></a>';
        document.body.appendChild(nav);
    }
    else {
        nav = document.createElement("NAV");
        nav.innerHTML = '<a href="/"><u>FAINT.xyz</u></a>';
        document.body.appendChild(nav);
    }
}

function init() {

    checkLinks();

    //  export-js
    var footer = document.createElement("FOOTER");
    Export.init(footer);
    document.getElementsByTagName("MAIN").item(0).appendChild(footer);
    document.styleSheets.item(0).insertRule("@media print{main > footer:last-child {display: none;}}", document.styleSheets.item(0).cssRules.length);

    navInit();

    var hashLinks = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < hashLinks.length; i++) {
        hashLinks.item(i).addEventListener("click", navHashFromLink, false);
    }

    navHashFromLocation();

}

function scriptLoaded(e) {
    scripts_loaded &= scripts[this.dataset.name];
    if (scripts_loaded & MAX_SCRIPTS === MAX_SCRIPTS) init();
}

function loadScripts() {
    var tag = document.createElement('script');
    tag.dataset.name = "export-js";
    tag.src = "/!DATA!/scripts/export-js/export.js";
    tag.addEventListener("loaded", scriptLoaded, false);
    document.head.appendChild(tag, document.head.firstElementChild);
}

document.addEventListener("DOMContentLoaded", loadScripts, false);
window.addEventListener("popstate", navHashFromLocation, false);
