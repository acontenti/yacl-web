<template>
	<div id="main">
		<header>
			<h1 class="title">YACL COOKBOOK</h1>
			<div class="top-bar">
				<div id="welcome-title">{{ user.displayName }}'s cookbook</div>
				<button id="new-button" @click="newRecipe">new recipe</button>
				<button id="logout-button" @click="signOut">logout</button>
			</div>
		</header>
		<main>
			<router-view/>
			<div id="book">
				<router-link v-for="recipe in recipes" :key="recipe.docId"
							 :to="{ name:'recipe', params: { id: recipe.docId } }" class='book-entry'>
					<strong>{{ recipe.name }}</strong><br><em>{{ recipe.description }}</em>
				</router-link>
			</div>
		</main>
	</div>
</template>

<script>
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import jsyaml from "js-yaml";
import Utils from "@/util/Utils";

export default {
	name: "Main",
	data() {
		return {
			user: this.$firebase.auth().currentUser || {},
			recipes: []
		};
	},
	methods: {
		async newRecipe() {
			const {value: name} = await this.$swal.fire({
				title: "New recipe name",
				input: "text",
				showCancelButton: true,
				inputValidator: (value) => {
					if (!value) return "You need to write something!";
				}
			});
			if (name) {
				const db = this.$firebase.firestore();
				let doc = await db.collection("users").doc(this.user.uid).collection("recipes").add({
					name: name,
					yacl: Utils.getEmptyRecipe(name)
				});
				await this.$router.push({name: "recipe", params: {id: doc.id}});
			}
		},
		signOut() {
			this.$firebase.auth().signOut().then(() => {
				this.$router.replace({name: "home"});
			});
		}
	},
	mounted() {
		this.user = this.user || this.$firebase.auth().currentUser;
		const db = this.$firebase.firestore();
		let recipesRef = db.collection("users").doc(this.user.uid).collection("recipes");
		recipesRef.get().then(querySnapshot => {
			this.recipes = [];
			querySnapshot.forEach(doc => {
				try {
					const it = doc.data();
					const recipe = jsyaml.safeLoad(it.yacl);
					recipe.docId = doc.id;
					this.recipes.push(recipe);
				} catch (e) {
					console.debug(e);
				}
			});
		});
		recipesRef.onSnapshot(snapshot => {
			this.recipes = [];
			snapshot.forEach(doc => {
				try {
					const it = doc.data();
					const recipe = jsyaml.safeLoad(it.yacl);
					recipe.docId = doc.id;
					this.recipes.push(recipe);
				} catch (e) {
					console.debug(e);
				}
			});
		});
	}
};
</script>

<style lang="scss" scoped>
#main {
	display: flex;
	flex-direction: column;
	flex-grow: 1;

	header {
		display: flex;
		flex-direction: column;
		flex-grow: 0;
	}

	main {
		display: flex;
		flex-direction: row-reverse;
		flex-grow: 1;
		margin: 0 10px;
		border: 3px solid;
		overflow: hidden;

		@media (max-width: 600px) {
			flex-direction: column-reverse;
			overflow: unset;
		}
	}

	#book {
		flex-grow: 1;
		min-width: 30vw;
		overflow: auto;
	}

	div ~ #book {
		@media (max-width: 600px) {
			max-height: 50vh;
		}
	}

	.book-entry {
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
		padding: 10px;
		color: black;
		text-decoration: none;
		display: block;

		&.router-link-active {
			background: rgba(0, 0, 0, 0.1);
		}

		&:hover {
			background: rgba(0, 0, 0, 0.2);
			cursor: pointer;
		}

		&:hover:active {
			background: rgba(0, 0, 0, 0.3);
		}
	}
}
</style>
