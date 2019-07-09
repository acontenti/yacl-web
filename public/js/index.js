let yamldoc_editor;
let db;
$(() => {
	yamldoc_editor = CodeMirror.fromTextArea($('#yaml-textarea')[0], {
		mode: "yaml",
		lineNumbers: true,
		viewportMargin: Infinity,

	});
	firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
	const ui = new firebaseui.auth.AuthUI(firebase.auth());
	ui.start('#firebaseui-auth-container', {
		callbacks: {
			signInSuccessWithAuthResult: function (authResult, redirectUrl) {
				let user = firebase.auth().currentUser;
				db.collection("users").doc(user.uid).get().then(docSnapshot => {
					if (!docSnapshot.exists) {
						db.collection("users").doc(user.uid).set().then(() => {
							login();
						});
					} else login();
				});
				return false;
			}
		},
		// Will use popup for IDP Providers sign-in flow instead of the default, redirect.
		signInFlow: 'popup',
		signInSuccessUrl: '/',
		credentialHelper: firebaseui.auth.CredentialHelper.NONE,
		signInOptions: [
			firebase.auth.EmailAuthProvider.PROVIDER_ID
		]
	});
	$('#logout-button').click(function () {
		let user = firebase.auth().currentUser;
		if (user) {
			firebase.auth().signOut().then(() => {
				window.location.reload();
			});
		}
	});
	db = firebase.firestore();
});

function openEditor(docId) {
	let user = firebase.auth().currentUser;
	db.collection('users').doc(user.uid).collection('recipes').doc(docId).get().then(doc => {
		let it = doc.data();
		$('#editor').show();
		yamldoc_editor.setValue(it.yacl);
	});
}

function loadBook(user) {
	db.collection('users').doc(user.uid).collection('recipes').get().then(querySnapshot => {
		querySnapshot.forEach(doc => {
			let it = doc.data();
			let app = $("<div class='book-entry' data-id='" + doc.id + "'><strong>" + it.name + "</strong><br><em>" + it.description + "</em></div>");
			app.click(() => {
				openEditor(doc.id);
			});
			$('#book').append(app);
		});
	});
}

function login() {
	let user = firebase.auth().currentUser;
	$('header').toggleClass('open');
	$('main').toggleClass('open');
	$('.top-bar').show();
	$('#login-container').hide();
	$('#welcome-title').text(user.displayName + "'s YACL cookbook");
	loadBook(user);
}