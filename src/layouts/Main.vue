<template>
	<q-layout view="LHh LpR fFf">
		<q-header elevated>
			<app-bar/>
			<q-toolbar>
				<q-btn v-if="$route.name !== 'app'" dense flat icon="arrow_back" round
					   @click="$router.push({name:'app'})">
					<q-tooltip>Back</q-tooltip>
				</q-btn>
				<q-toolbar-title shrink>YACL COOKBOOK</q-toolbar-title>
				<q-space/>
				<portal-target class="row no-wrap" name="toolbar"></portal-target>
				<q-btn flat icon="add" no-wrap round @click="newRecipe">
					<q-tooltip>New recipe</q-tooltip>
				</q-btn>
				<q-btn flat round>
					<q-avatar color="white" text-color="primary">
						{{ username }}
						<q-menu auto-close fit>
							<q-list>
								<q-item-label header>{{ user.displayName }}'s cookbook</q-item-label>
								<q-item clickable @click="$logout">
									<q-item-section avatar>
										<q-icon name="logout"/>
									</q-item-section>
									<q-item-section>Logout</q-item-section>
								</q-item>
							</q-list>
						</q-menu>
					</q-avatar>
				</q-btn>
			</q-toolbar>
		</q-header>
		<q-page-container>
			<router-view/>
		</q-page-container>
		<q-footer bordered class="bg-grey-14 q-px-sm q-py-xs text-left">
			Copyright &copy; 2019-{{ new Date().getFullYear() }}, Alessandro Contenti
		</q-footer>
	</q-layout>
</template>

<script lang="ts">
import Utils from "src/util/utils";
import {Component, Vue} from "vue-property-decorator";
import firebase from "firebase/app";
import AppBar from "components/AppBar.vue";

@Component({
	components: {AppBar}
})
export default class Main extends Vue {
	user: firebase.UserInfo | null = this.$firebase.auth().currentUser;

	get username() {
		return this.user?.displayName?.split(" ")?.map(it => it.charAt(0))?.join("")?.substr(0, 2) ?? "?";
	}

	newRecipe() {
		this.$q.dialog({
			title: "New recipe name",
			prompt: {
				model: "",
				isValid: (val: string) => !!val
			},
			cancel: true,
			persistent: true
		}).onOk(async (name?: string) => {
			if (name && this.user) {
				const db = this.$firebase.firestore();
				let doc = await db.collection("users").doc(this.user.uid).collection("recipes").add({
					name: name,
					yacl: Utils.getEmptyRecipe(name)
				});
				await this.$router.push({name: "recipe", params: {id: doc.id}});
			}
		});
	}

	mounted() {
		this.user = this.user ?? this.$firebase.auth().currentUser;
		if (!this.user) {
			this.$logout();
			return;
		}
	}
};
</script>

<style lang="scss" scoped>
</style>
