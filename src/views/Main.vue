<template>
	<div id="main">
		<header>
			<h1 class="title">YACL COOKBOOK</h1>
			<div class="top-bar">
				<div id="welcome-title">{{user.displayName}}'s cookbook</div>
				<button id="new-button">new recipe</button>
				<button @click="signOut" id="logout-button">logout</button>
			</div>
		</header>
		<main>
			<div id="book">
				<router-link :key="recipe.docId" :to="{ name:'recipe', params: { id: recipe.docId } }"
							 class='book-entry' v-for="recipe in recipes">
					<strong>{{recipe.name}}</strong><br><em>{{recipe.description}}</em>
				</router-link>
			</div>
			<router-view/>
		</main>
	</div>
</template>

<script>
	import jsyaml from "js-yaml";

	export default {
		name: "Main",
		data() {
			return {
				user: this.$firebase.auth().currentUser || {},
				recipes: []
			};
		},
		methods: {
			signOut() {
				this.$firebase.auth().signOut().then(() => {
					this.$router.replace({name: "home"});
				});
			}
		},
		mounted() {
			this.user = this.user || this.$firebase.auth().currentUser;
			const db = this.$firebase.firestore();
			db.collection("users").doc(this.user.uid).collection("recipes").get().then(querySnapshot => {
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
			flex-direction: row;
			flex-grow: 1;
			margin: 0 10px;
			border: 3px solid;
			overflow: hidden;

			@media (max-width: 600px) {
				flex-direction: column;
				overflow: unset;
			}
		}

		#book {
			flex-grow: 1;
			min-width: 30vw;
			overflow: auto;

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
