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
		let html = yamldocjs.yamldoc2html(yaml);
		if (html === undefined || md === undefined) return;
		$html_div.html(html);
	});
});