let openRecipe;
let pendingChanges = false;
let yamldoc_editor;
let db;
$(() => {
	db = firebase.firestore();
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
		signInFlow: 'popup',
		signInSuccessUrl: '/',
		credentialHelper: firebaseui.auth.CredentialHelper.NONE,
		signInOptions: [
			firebase.auth.EmailAuthProvider.PROVIDER_ID
		]
	});
	$('#logout-button').click(function () {
		if (getUser()) {
			firebase.auth().signOut().then(() => {
				window.location.reload();
			});
		}
	});
	$('#save-button').click(async () => {
		await saveRecipe(true);
	});
	$('#close-button').click(async () => {
		await closeEditor();
	});
	$('#delete-button').click(async () => {
		await deleteRecipe();
	});
	$('#new-button').click(async () => {
		await newRecipe();
	});
});

function emptyYacl(name) {
	return "name: " + name + "\n" +
		"description:\n" +
		"quantity:\n" +
		"category:\n" +
		"time:\n" +
		"  preparation:\n" +
		"  cooking:\n" +
		"cuisine:\n" +
		"image:\n" +
		"tags:\n" +
		"ingredients:\n" +
		"instructions:\n";
}

async function showChangesDialog() {
	const {value: decision} = await Swal.fire({
		title: 'Unsaved recipe',
		text: "You have pending changes in currently open recipe",
		type: 'warning',
		showCancelButton: true,
		confirmButtonText: 'Save and continue',
		showLoaderOnConfirm: true,
		preConfirm: async () => {
			await saveRecipe();
			return true;
		},
		cancelButtonText: 'Cancel'
	});
	return decision;
}

async function newRecipe() {
	if (pendingChanges) {
		if (!await showChangesDialog())
			return;
	}
	const {value: name} = await Swal.fire({
		title: 'New recipe name',
		input: 'text',
		showCancelButton: true,
		inputValidator: (value) => {
			if (!value) return 'You need to write something!'
		}
	});
	if (name) {
		let user = getUser();
		db.collection('users').doc(user.uid).collection('recipes').add({
			name: name,
			description: "",
			yacl: emptyYacl(name)
		}).then((doc) => {
			loadBook(user);
			openEditor(doc.id, user);
		});
	}
}

async function deleteRecipe() {
	if (openRecipe !== undefined) {
		async function doDelete() {
			let user = getUser();
			await db.collection('users').doc(user.uid).collection('recipes').doc(openRecipe).delete();
			pendingChanges = false;
			loadBook(user);
			await closeEditor();
		}

		Swal.fire({
			title: 'Delete recipe',
			text: 'Are you really sure? No going back after this!',
			type: 'warning',
			confirmButtonText: 'Delete',
			showCancelButton: true,
			showLoaderOnConfirm: true,
			preConfirm: async () => {
				await doDelete();
				return true;
			},
			allowOutsideClick: () => !Swal.isLoading()
		}).then((result) => {
			if (result.value) {
				Swal.fire("Recipe deleted", '', 'success');
			}
		})
	}
}

async function closeEditor() {
	if (openRecipe !== undefined) {
		if (pendingChanges) {
			if (!await showChangesDialog())
				return;
		}
		openRecipe = undefined;
		$('#editor').hide();
		getEditor().setValue('');
		$('#save-button').attr("disabled", true);
		$('#delete-button').attr("disabled", true);
		$('#close-button').attr("disabled", true);
	}
}

async function saveRecipe(showDialog = false) {
	async function save() {
		if (openRecipe !== undefined && pendingChanges) {
			let user = getUser();
			await db.collection('users').doc(user.uid).collection('recipes').doc(openRecipe).update({
				yacl: getEditor().getValue()
			});
			pendingChanges = false;
			loadBook(user);
			$('#save-button').attr("disabled", true);
		}
	}

	if (showDialog) {
		await Swal.fire({
			title: 'Saving',
			allowOutsideClick: false,
			allowEscapeKey: false,
			showConfirmButton: false,
			onBeforeOpen: async () => {
				Swal.showLoading();
				await save();
				Swal.close();
			}
		});
	} else await save();
}

function getEditor() {
	if (yamldoc_editor === undefined) {
		yamldoc_editor = CodeMirror.fromTextArea(document.getElementById('yaml-textarea'), {
			mode: "yaml",
			lineNumbers: true,
			viewportMargin: Infinity
		});
		yamldoc_editor.on('change', (instance, changeObj) => {
			if (changeObj.origin !== 'setValue' && !pendingChanges) {
				pendingChanges = true;
				$('#save-button').attr("disabled", false);
			}
		});
	}
	return yamldoc_editor;
}

function getUser() {
	return firebase.auth().currentUser;
}

function openEditor(docId, user) {
	user = user || getUser();
	db.collection('users').doc(user.uid).collection('recipes').doc(docId).get().then(doc => {
		let it = doc.data();
		$('#editor').show();
		getEditor().setValue(it.yacl);
		openRecipe = docId;
		$('#close-button').attr("disabled", false);
		$('#delete-button').attr("disabled", false);
	});
}

function loadBook(user) {
	user = user || getUser();
	db.collection('users').doc(user.uid).collection('recipes').get().then(querySnapshot => {
		let book = $('#book');
		book.empty();
		querySnapshot.forEach(doc => {
			let it = doc.data();
			let app = $("<div class='book-entry' data-id='" + doc.id + "'><strong>" + it.name + "</strong><br><em>" + it.description + "</em></div>");
			app.click(async () => {
				if (pendingChanges) {
					if (!await showChangesDialog())
						return;
				}
				openEditor(doc.id);
			});
			book.append(app);
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