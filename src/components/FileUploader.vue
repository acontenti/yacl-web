<template>
	<q-dialog ref="dialog" @hide="onDialogHide">
		<q-card class="q-dialog-plugin">
			<q-card-section>
				<div class="text-h6">Import recipes file</div>
				<q-file ref="importFileInput" v-model="importFile" accept="text/yaml, .yml, .yaml"
					label="Cookbook file (.yaml)" />
			</q-card-section>
			<q-card-section v-if="importProgress > 0">
				<q-linear-progress v-model="importProgress" />
			</q-card-section>
			<q-card-actions align="right">
				<q-btn color="negative" flat label="Cancel" @click="onCancelClick" />
				<q-btn :disable="!importFile" color="primary" flat label="Import" @click="importRecipes" />
			</q-card-actions>
		</q-card>
	</q-dialog>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import {QDialog} from "quasar";
import jsyaml from "js-yaml";
import firebase from "firebase";

@Component
export default class FileUploader extends Vue {
	importFile: File | null = null;
	importProgress = 0.0;
	user: firebase.UserInfo | null = this.$firebase.auth().currentUser;

	async importRecipes() {
		let fileContent = await this.importFile?.text();
		if (fileContent && this.user) {
			const db = this.$firebase.firestore();
			const docs = jsyaml.loadAll(fileContent);
			for (const value of docs) {
				await db.collection("users").doc(this.user.uid).collection("recipes").add({
					yacl: jsyaml.dump(value)
				});
				this.importProgress += 1 / docs.length;
			}
			this.$q.dialog({
				message: docs.length === 1 ? `Imported 1 recipe` : `Imported ${docs.length} recipes`,
				title: "Import finished"
			});
		}
		this.onOKClick();
	}

	// following method is REQUIRED
	// (don't change its name --> "show")
	show() {
		(this.$refs.dialog as QDialog).show();
	}

	// following method is REQUIRED
	// (don't change its name --> "hide")
	hide() {
		(this.$refs.dialog as QDialog).hide();
	}

	onDialogHide() {
		// required to be emitted
		// when QDialog emits "hide" event
		this.$emit("hide");
	}

	onOKClick() {
		// on OK, it is REQUIRED to
		// emit "ok" event (with optional payload)
		// before hiding the QDialog
		this.$emit("ok");
		// or with payload: this.$emit('ok', { ... })

		// then hiding dialog
		this.hide();
	}

	onCancelClick() {
		// we just need to hide the dialog
		this.hide();
	}
};
</script>

<style scoped>

</style>
