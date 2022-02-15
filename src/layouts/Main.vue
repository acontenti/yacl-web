<template>
	<q-layout view="hHh LpR fFf">
		<q-header elevated>
			<app-bar />
			<q-toolbar>
				<q-btn dense flat icon="menu" round @click="toggleLeftDrawer">
					<q-tooltip>Menu</q-tooltip>
				</q-btn>
				<q-btn :to="{name:'app'}" flat no-caps no-wrap stretch>
					<q-toolbar-title>YACL COOKBOOK</q-toolbar-title>
					<q-tooltip>Home</q-tooltip>
				</q-btn>
				<q-space />
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
								<q-item clickable @click="importRecipes">
									<q-item-section side>
										<q-icon name="file_upload" />
									</q-item-section>
									<q-item-section>Import recipes</q-item-section>
								</q-item>
								<q-item clickable @click="exportRecipes">
									<q-item-section side>
										<q-icon name="file_download" />
									</q-item-section>
									<q-item-section>Export all recipes</q-item-section>
								</q-item>
								<q-item clickable @click="$logout">
									<q-item-section side>
										<q-icon name="logout" />
									</q-item-section>
									<q-item-section>Logout</q-item-section>
								</q-item>
							</q-list>
						</q-menu>
					</q-avatar>
				</q-btn>
			</q-toolbar>
		</q-header>
		<q-drawer v-model="leftDrawerOpen" :width="200" bordered show-if-above side="left">
			<q-list>
				<q-item-label header>Categories</q-item-label>
				<q-item :to="{name:'app'}" exact>
					<q-item-section>
						<q-item-label>All</q-item-label>
					</q-item-section>
				</q-item>
				<q-item v-for="category in categories" :key="category"
					:to="{name:'app', params: {category}}" exact>
					<q-item-section>
						<q-item-label>{{ category | capitalize }}</q-item-label>
					</q-item-section>
				</q-item>
			</q-list>
		</q-drawer>
		<q-page-container>
			<router-view />
		</q-page-container>
		<q-footer bordered class="bg-grey-14 q-px-sm q-py-xs text-left">
			Copyright &copy; 2019-{{ year }}, Alessandro Contenti
		</q-footer>
	</q-layout>
</template>

<script lang="ts">
import Utils from "src/util/utils";
import {Component, Vue} from "vue-property-decorator";
import firebase from "firebase/app";
import AppBar from "components/AppBar.vue";
import {exportFile, format} from "quasar";
import FileUploader from "components/FileUploader.vue";
import jsyaml from "js-yaml";
import {Recipe} from "src/util/model";
import {NavigationGuardNext, Route} from "vue-router/types/router";
import DocumentData = firebase.firestore.DocumentData;
import QuerySnapshot = firebase.firestore.QuerySnapshot;
import capitalize = format.capitalize;

@Component({
	components: {AppBar},
	filters: {
		capitalize(string: string) {
			return capitalize(string);
		}
	}
})
export default class Main extends Vue {
	user: firebase.UserInfo | null = this.$firebase.auth().currentUser;
	leftDrawerOpen = false;
	year = new Date().getFullYear();
	categories: string[] = [];
	unsubscribe: (() => void) | null = null;

	get username() {
		return this.user?.displayName?.split(" ")?.map(it => it.charAt(0))?.join("")?.substr(0, 2) ?? "?";
	}

	toggleLeftDrawer() {
		this.leftDrawerOpen = !this.leftDrawerOpen;
	}

	newRecipe() {
		this.$q.dialog({
			title: "New recipe name",
			prompt: {
				model: "",
				isValid: (val: string) => !!val
			},
			cancel: true
		}).onOk(async (name?: string) => {
			if (name && this.user) {
				const db = this.$firebase.firestore();
				let doc = await db.collection("users").doc(this.user.uid).collection("recipes").add({
					yacl: Utils.getEmptyRecipe(name)
				});
				await this.$router.push({name: "recipe", params: {id: doc.id}});
			}
		});
	}

	importRecipes() {
		this.$q.dialog({
			component: FileUploader,
			persistent: true
		});
	}

	exportRecipes() {
		if (this.user) {
			const db = this.$firebase.firestore();
			let recipesRef = db.collection("users").doc(this.user.uid).collection("recipes");
			const recipes: string[] = [];
			recipesRef.get().then(querySnapshot => {
				querySnapshot.forEach(doc => {
					try {
						const it = doc.data();
						recipes.push(it.yacl);
					} catch (e) {
						console.debug(e);
					}
				});
				const result = recipes.join("\n---\n");
				if (!exportFile("yacl-cookbook.yaml", result, "text/yaml")) {

				}
			});
		}
	}

	loadCategories(querySnapshot: QuerySnapshot<DocumentData>) {
		const categories = new Set<string>();
		querySnapshot.forEach(doc => {
			try {
				const it = doc.data();
				const recipe = jsyaml.load(it.yacl) as Recipe | undefined;
				if (recipe && recipe.category) {
					categories.add(recipe.category);
				}
			} catch (e) {
				console.debug(e);
			}
		});
		this.categories = Array.from(categories).sort();
	}

	cleanup() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}

	mounted() {
		this.user = this.user ?? this.$firebase.auth().currentUser;
		if (!this.user) {
			this.$logout();
			return;
		}
		const db = this.$firebase.firestore();
		let recipesRef = db.collection("users").doc(this.user.uid).collection("recipes");
		recipesRef.get().then(querySnapshot => {
			this.loadCategories(querySnapshot);
		});
		this.unsubscribe = recipesRef.onSnapshot(snapshot => {
			this.loadCategories(snapshot);
		});
	}

	beforeRouteLeave(to: Route, from: Route, next: NavigationGuardNext) {
		this.cleanup();
		next();
	}

	beforeDestroy() {
		this.cleanup();
	}
};
</script>

<style lang="scss" scoped>
</style>
