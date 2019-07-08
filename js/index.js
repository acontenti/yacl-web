$(function () {
	let $html_div = $('#html-div');
	let yamldoc_editor = CodeMirror.fromTextArea($('#yaml-textarea')[0], {
		mode: "yaml",
		lineNumbers: true,
		viewportMargin: Infinity
	});
	$('#convert-button').click(function () {
		$html_div.html('<br>');
		let yaml = yamldoc_editor.getValue();
		let html = yamldoc2html(yaml);
		if (html === undefined) return;
		$html_div.html(html);
	});
});

const MAX_HEADING = 4;

function objectMap(object, mapFn) {
	return object != null ? Object.keys(object).map(function (key) {
		return mapFn(key, object[key]);
	}) : [''];
}

function styleHtml(node) {
	if (typeof node !== 'string') return node;
	if (node.startsWith("data:image/"))
		return "<img src='" + node + "'  alt='image' />";
	return node
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\n/g, "<br>")
		.replace(/(^|[^\\])__([^]*?[^\\])__/g, "$1<strong>$2</strong>")
		.replace(/(^|[^\\])_([^]*?[^\\_])_/g, "$1<em>$2</em>")
		.replace(/(^|[^\\])~~([^~]*[^\\])~~/g, "$1<del>$2</del>")
		.replace(/(^|[^\\])~([^~]*[^\\])~/g, "$1<sub>$2</sub>")
		.replace(/(^|[^\\])\^([^^]*[^\\])\^/g, "$1<sup>$2</sup>")
		.replace(/(^|[^\\])\+\+([^+]*[^\\])\+\+/g, "$1<ins>$2</ins>")
		.replace(/(^|[^\\])==([^=]*[^\\])==/g, "$1<mark>$2</mark>")
		.replace(/(^|[^\\])```([^`]*[^\\])```/g, "$1<pre><code>$2</code></pre>");
}

function parseNodeHtml(node, indent, headingLevel, slideContent) {
	const spaces = '\t'.repeat(indent);
	if (Array.isArray(node)) return spaces + "<ul>\n" + node.map(function (it) {
		return spaces + "\t<li>\n"
			+ parseNodeHtml(it, indent + 2, headingLevel, false)
			+ spaces + "\t</li>\n";
	}).join("") + spaces + "</ul>\n";
	else if (typeof node === 'object') {
		return (slideContent ? spaces + "<ul>\n" : "")
			+ objectMap(node, function (key, it) {
				const headingSize = headingLevel <= MAX_HEADING ? headingLevel : MAX_HEADING;
				return (slideContent ? spaces + "\t" : spaces)
					+ "<h" + headingSize + ">" + styleHtml(key) + "</h" + headingSize + ">\n"
					+ parseNodeHtml(it, indent + (slideContent ? 1 : 0), headingLevel + 1, true);
			}).join("")
			+ (slideContent ? spaces + "</ul>\n" : "");
	} else {
		return (slideContent ? spaces + "<ul>\n" + spaces + "\t" : spaces)
			+ "<span>" + styleHtml(node) + "</span>"
			+ (slideContent ? "\n" + spaces + "</ul>\n" : "\n");
	}
}

function yamldoc2html(yamldoc) {
	let doc;
	try {
		doc = jsyaml.safeLoad(yamldoc);
		console.log(doc);
	} catch (e) {
		console.log(e);
		return undefined;
	}
	if (Array.isArray(doc)) {
		return parseNodeHtml(doc, 0, 1, false);
	} else if (typeof doc === 'string') {
		return styleHtml(doc);
	} else if (typeof doc === 'object') {
		return objectMap(doc, function (key, it) {
			return "<h1>" + key + "</h1>\n" + parseNodeHtml(it, 0, 2, true);
		}).join("");
	} else return doc;
}