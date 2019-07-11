const sessionId = Math.random().toString(36).substr(2, 9);
let openRecipe;
let pendingChanges = false;
let yamldoc_editor;
let db;
$(async () => {
	db = firebase.firestore();
	const ui = new firebaseui.auth.AuthUI(firebase.auth());
	ui.start('#firebaseui-auth-container', {
		callbacks: {
			signInSuccessWithAuthResult: () => false
		},
		signInFlow: 'popup',
		credentialHelper: firebaseui.auth.CredentialHelper.NONE,
		signInOptions: [
			firebase.auth.EmailAuthProvider.PROVIDER_ID
		]
	});
	firebase.auth().onAuthStateChanged(user => {
		if (user) {
			db.collection("users").doc(user.uid).get().then(docSnapshot => {
				if (!docSnapshot.exists) {
					db.collection("users").doc(user.uid).set().then(() => {
						login();
					});
				} else login();
			});
		}
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
	}).attr("disabled", true);
	$('#close-button').click(async () => {
		await closeEditor();
	}).attr("disabled", true);
	$('#delete-button').click(async () => {
		await deleteRecipe();
	}).attr("disabled", true);
	$('#new-button').click(async () => {
		await newRecipe();
	});
});

$(window).on('beforeunload', function () {
	let user = getUser();
	db.collection('users').doc(user.uid).update({
		sessions: firebase.firestore.FieldValue.arrayRemove(sessionId)
	});
	if (openRecipe && pendingChanges) {
		db.collection('users').doc(user.uid).collection('recipes').doc(openRecipe).update({
			locked: ''
		});
	}
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
			return await saveRecipe();
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
		let doc = await db.collection('users').doc(user.uid).collection('recipes').add({
			yacl: emptyYacl(name)
		});
		loadBook(user);
		await openEditor(doc.id, user);
	}
}

async function deleteRecipe() {
	if (openRecipe) {
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
	if (openRecipe) {
		if (pendingChanges) {
			if (!await showChangesDialog())
				return;
		}
		openRecipe = undefined;
		$('.book-entry').removeClass('open');
		$('#editor').hide();
		getEditor().setValue('');
		$('#save-button').attr("disabled", true);
		$('#delete-button').attr("disabled", true);
		$('#close-button').attr("disabled", true);
	}
}

async function saveRecipe(showDialog = false) {
	async function save() {
		if (openRecipe && pendingChanges) {
			let value = getEditor().getValue();
			try {
				jsyaml.safeLoad(value);
			} catch (e) {
				Swal.fire({
					title: 'Cannot save recipe',
					html: '<pre class="exception">Error:<br>' + e.message + '</pre>',
					type: 'error'
				});
				return false;
			}
			let user = getUser();
			await db.collection('users').doc(user.uid).collection('recipes').doc(openRecipe).update({
				yacl: value,
				locked: ''
			});
			pendingChanges = false;
			loadBook(user);
			$('#save-button').attr("disabled", true);
			return true;
		}
		return true;
	}

	if (showDialog) {
		let {value: result} = await Swal.fire({
			title: 'Saving',
			allowOutsideClick: false,
			allowEscapeKey: false,
			showConfirmButton: false,
			onBeforeOpen: async () => {
				Swal.showLoading();
				let result = await save();
				if (result) Swal.close();
				return result;
			}
		});
		return result;
	} else {
		return await save();
	}
}

function getEditor() {
	if (yamldoc_editor === undefined) {
		yamldoc_editor = CodeMirror.fromTextArea(document.getElementById('yaml-textarea'), {
			mode: "yaml",
			lineNumbers: true,
			viewportMargin: Infinity
		});
		yamldoc_editor.on('change', (instance, changeObj) => {
			if (changeObj.origin !== 'setValue' && openRecipe && !pendingChanges) {
				pendingChanges = true;
				let user = getUser();
				db.collection('users').doc(user.uid).collection('recipes').doc(openRecipe).update({
					locked: sessionId
				});
				$('#save-button').attr("disabled", false);
			}
		});
	}
	return yamldoc_editor;
}

function getUser() {
	return firebase.auth().currentUser;
}

async function openEditor(docId, user) {
	user = user || getUser();
	const docReference = await db.collection('users').doc(user.uid).collection('recipes').doc(docId);
	let doc = await docReference.get();
	const it = doc.data();
	if (it.locked && it.locked !== '' && it.locked !== sessionId) {
		let session = await db.collection('users').doc(user.uid).collection('sessions').doc(it.locked).get();
		if (!session.exists) {
			await docReference.update({locked: ''});
		} else {
			Swal.fire('Cannot open recipe', 'This recipe is being edited on another instance of YACL Cookbook', 'error');
			return;
		}
	}
	$('#editor').show();
	getEditor().setValue(it.yacl);
	openRecipe = docId;
	$('.book-entry').removeClass('open');
	$('.book-entry[data-id=' + openRecipe + ']').addClass('open');
	$('#close-button').attr("disabled", false);
	$('#delete-button').attr("disabled", false);
	docReference.onSnapshot(doc => {
		if (!pendingChanges && !!doc.metadata.hasPendingWrites !== true) {
			let it = doc.data();
			if (it.locked && it.locked !== '' && it.locked !== sessionId) {
				Swal.fire('Locking editing', 'This recipe is being edited on another instance of YACL Cookbook', 'warning');
				getEditor().setOption('readOnly', true);
			} else {
				if (getEditor().getOption('readOnly') === true) {
					getEditor().setOption('readOnly', false);
					Swal.fire('Unlocking editing', 'You can now edit this recipe', 'success');
				}
				getEditor().setValue(it.yacl);
			}
		}
	});
}

function loadBook(user) {
	user = user || getUser();
	db.collection('users').doc(user.uid).collection('recipes').get().then(querySnapshot => {
		let book = $('#book');
		book.empty();
		querySnapshot.forEach(doc => {
			let desc;
			let name;
			let yacl;
			let it = doc.data();
			let docId = doc.id;
			try {
				yacl = jsyaml.safeLoad(it.yacl);
				name = yacl['name'];
				desc = yacl['description'];
			} catch (e) {
			}
			let app = $("<div class='book-entry' data-id='" + docId + "'><strong>" + name + "</strong><br><em>" + desc + "</em></div>");
			app.click(async () => {
				if (pendingChanges) {
					if (!await showChangesDialog())
						return;
				}
				await openEditor(docId);
			});
			book.append(app);
		});
	});
}

function login() {
	let user = firebase.auth().currentUser;
	db.collection('users').doc(user.uid).update({
		sessions: firebase.firestore.FieldValue.arrayUnion(sessionId)
	});
	$('header').toggleClass('open');
	$('main').toggleClass('open');
	$('.top-bar').show();
	$('#login-container').hide();
	$('#welcome-title').text(user.displayName + "'s YACL cookbook");
	loadBook(user);
}