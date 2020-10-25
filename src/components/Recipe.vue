<template>
	<div id="editor">
		<div class="editor-container">
			<div class="editor-toolbar">
				<button v-if="pendingChanges" @click="saveRecipe(true)">save recipe</button>
				<button v-if="!pendingChanges" @click="editRecipe">edit recipe</button>
				<button @click="closeRecipe">close recipe</button>
				<button @click="deleteRecipe">delete recipe</button>
			</div>
			<codemirror v-if="pendingChanges" v-model="yaml" :options="cmOptions" class="yaml-textarea"/>
			<div v-if="recipe && !pendingChanges" class="recipe-viewer">
				<div class="header">
					<div class="info">
						<h2 class="name">{{ recipe.name }}</h2>
						<div class="desc">{{ recipe.description }}</div>
						<ul class="tags">
							<li v-for="(tag, i) in recipe.tags" :key="'tag-' + i">{{ tag }}</li>
						</ul>
						<div class="category"><strong>Category:</strong> {{ recipe.category }}</div>
						<div class="quantity"><strong>Quantity:</strong> {{ recipe.quantity }}</div>
						<div class="time">
							<div class="total"><strong>Total time:</strong> {{ getTotalTime() | formatTime }}</div>
							<div><strong>Preparation time:</strong> {{ getTime("prep") | formatTime }}</div>
							<div><strong>Cooking time:</strong> {{ getTime("cook") | formatTime }}</div>
							<div><strong>Waiting time:</strong> {{ getTime("wait") | formatTime }}</div>
						</div>
					</div>
					<div v-show="recipe.image !== undefined && recipe.image !== ''"
						 :style="'background-image: url(\'' + recipe.image + '\')'" class="image"/>
				</div>
				<div class="ingredients-container">
					<h3>Ingredients</h3>
					<div class="controls">
						<button @click="mode = null">Original</button>
						<button @click="mode = 'metric'">Metric</button>
						<label><span>Scalamento:</span><input v-model="scaleFactor" type="number"/></label>
					</div>
					<table class="ingredients">
						<tr v-for="(quantity, ingredient, i) in recipe.ingredients" :key="'ingredient-' + i"
							class="ingredient">
							<td class="name" v-text="ingredient"></td>
							<td v-if="quantity" class="quantity" v-text="computedQuantity(quantity)"></td>
							<td v-if="quantity" class="unit" v-text="computedUnit(quantity)"></td>
							<td v-else colspan="2">as needed</td>
						</tr>
					</table>
				</div>
				<h3>Instructions</h3>
				<table class="instructions">
					<thead>
					<tr>
						<th>Type</th>
						<th>Text</th>
						<th>Time</th>
					</tr>
					</thead>
					<tr v-for="(instruction, i) in recipe.instructions" :key="'instruction-' + i" class="instruction">
						<td>{{ (instruction.type || "") | formatType }}</td>
						<td>{{ instruction.text || instruction }}</td>
						<td>{{ (instruction.time || "") | parse | formatTime }}</td>
					</tr>
				</table>
			</div>
		</div>
	</div>
</template>

<script>
import {codemirror} from "vue-codemirror";
import "codemirror/mode/yaml/yaml";
import "codemirror/lib/codemirror.css";
import jsyaml from "js-yaml";
import humanizeDuration from "humanize-duration";
import parse from "parse-duration";
import Utils from "@/util/Utils.ts";

export default {
	name: "Recipe",
	components: {codemirror},
	data() {
		return {
			id: undefined,
			yaml: undefined,
			recipe: undefined,
			pendingChanges: false,
			scaleFactor: 1,
			mode: null,
			cmOptions: {
				mode: "yaml",
				readOnly: false
			}
		};
	},
	filters: {
		parse(time) {
			return parse(time);
		},
		formatTime(millis) {
			if (millis > 0)
				return humanizeDuration(millis);
			else return "-";
		},
		formatType(type) {
			switch (type) {
				case "cook":
					return "🍳";
				case "prep":
					return "🔪";
				case "wait":
					return "🕒";
				default:
					return "-";
			}
		}
	},
	methods: {
		getTotalTime() {
			return this.getTime("prep") + this.getTime("cook") + this.getTime("wait");
		},
		getTime(type) {
			return (this.recipe.instructions ?? []).reduce((last, it) => {
				if (it.time) {
					if (it.type === type) {
						return last + parse(it.time);
					}
				}
				return last;
			}, 0);
		},
		computedQuantity(quantity) {
			if (!quantity) return "";
			let [value, ...unit] = quantity.toString().split(" ");
			if (!value) return "";
			unit = unit.join(" ");
			value = Number.parseFloat(value);
			if (unit) {
				if (this.mode === "metric") {
					value = Utils.toMetricValue(unit, value);
				}
			}
			return Utils.round(value * this.scaleFactor);
		},
		computedUnit(quantity) {
			if (!quantity) return "";
			const unit = quantity.toString().split(" ")[1];
			if (unit) {
				if (this.mode === "metric") {
					return Utils.toMetricUnit(unit);
				}
				return unit;
			} else return "";
		},
		async save() {
			if (this.pendingChanges) {
				const user = this.$firebase.auth().currentUser;
				const db = this.$firebase.firestore();
				try {
					this.recipe = jsyaml.safeLoad(this.yaml);
				} catch (e) {
					this.$swal({
						title: "Cannot save recipe",
						html: "<pre class=\"exception\">Error:<br>" + e.message + "</pre>",
						type: "error"
					});
					return false;
				}
				await db.collection("users").doc(user.uid).collection("recipes").doc(this.id).update({
					yacl: this.yaml,
					locked: ""
				});
				this.pendingChanges = false;
				return true;
			}
			return true;
		},
		async saveRecipe(showDialog = false) {
			if (showDialog) {
				const {value: result} = await this.$swal({
					title: "Saving",
					allowOutsideClick: false,
					allowEscapeKey: false,
					showConfirmButton: false,
					onBeforeOpen: async () => {
						this.$swal.showLoading();
						const result = await this.save();
						if (result) this.$swal.close();
						return result;
					}
				});
				return result;
			} else {
				return await this.save();
			}
		},
		async showChangesDialog() {
			const {value: decision} = await this.$swal({
				title: "Unsaved recipe",
				text: "You have pending changes in currently open recipe",
				type: "warning",
				showCancelButton: true,
				confirmButtonText: "Save and continue",
				showLoaderOnConfirm: true,
				preConfirm: async () => {
					return await this.saveRecipe();
				},
				cancelButtonText: "Cancel"
			});
			return decision;
		},
		async closeRecipe() {
			if (this.pendingChanges) {
				if (!(await this.showChangesDialog()))
					return;
			}
			await this.$router.push({name: "app"});
		},
		async doDelete() {
			const user = this.$firebase.auth().currentUser;
			const db = this.$firebase.firestore();
			await db.collection("users").doc(user.uid).collection("recipes").doc(this.id).delete();
			this.pendingChanges = false;
		},
		deleteRecipe() {
			this.$swal({
				title: "Delete recipe",
				text: "Are you really sure? No going back after this!",
				type: "warning",
				confirmButtonText: "Delete",
				showCancelButton: true,
				showLoaderOnConfirm: true,
				preConfirm: async () => {
					await this.doDelete();
					return true;
				},
				allowOutsideClick: false
			}).then((result) => {
				if (result.value) {
					this.$swal("Recipe deleted", "", "success");
				}
			});
		},
		editRecipe() {
			const db = this.$firebase.firestore();
			const user = this.$firebase.auth().currentUser;
			const userDoc = db.collection("users").doc(user.uid);
			const docReference = userDoc.collection("recipes").doc(this.id);
			docReference.get().then(async doc => {
				const it = doc.data();
				if (it.locked && it.locked !== "" && it.locked !== this.$sessionId) {
					const session = await userDoc.collection("sessions").doc(it.locked).get();
					if (!session.exists) {
						await docReference.update({locked: ""});
						this.pendingChanges = true;
					} else {
						this.$swal("Cannot open recipe", "This recipe is being edited on another instance of YACL Cookbook", "error");
					}
				} else {
					this.pendingChanges = true;
				}
			});
		},
		cleanup() {
			if (this.pendingChanges) {
				const db = this.$firebase.firestore();
				const user = this.$firebase.auth().currentUser;
				db.collection("users").doc(user.uid).collection("recipes").doc(this.id).update({
					locked: ""
				});
			}
		},
		init(to = undefined) {
			this.id = (to ?? this.$route).params.id;
			this.yaml = "";
			this.recipe = undefined;
			this.pendingChanges = false;
			const db = this.$firebase.firestore();
			const docId = this.id;
			const user = this.$firebase.auth().currentUser;
			const userDoc = db.collection("users").doc(user.uid);
			const docReference = userDoc.collection("recipes").doc(docId);
			docReference.get().then(async doc => {
				const it = doc.data();
				this.yaml = it.yacl;
				this.recipe = jsyaml.safeLoad(this.yaml);
			});
			docReference.onSnapshot(doc => {
				if (!this.pendingChanges && !doc.metadata.hasPendingWrites) {
					const it = doc.data();
					if (it.locked && it.locked !== "" && it.locked !== this.$sessionId) {
						this.$swal("Locking editing", "This recipe is being edited on another instance of YACL Cookbook", "warning");
						this.cmOptions.readOnly = true;
					} else {
						if (this.cmOptions.readOnly === true) {
							this.cmOptions.readOnly = false;
							this.$swal("Unlocking editing", "You can now edit this recipe", "success");
						}
					}
					this.yaml = it.yacl;
					this.recipe = jsyaml.safeLoad(this.yaml);
				}
			});
		}
	},
	mounted() {
		this.init();
	},
	beforeRouteUpdate(to, from, next) {
		this.init(to);
		next();
	},
	beforeRouteLeave(to, from, next) {
		this.cleanup();
		next();
	},
	beforeDestroy() {
		this.cleanup();
	}
};
</script>

<style lang="scss" scoped>
#editor {
	flex-grow: 1;
	overflow: hidden;
	border-style: solid;
	border-width: 0 0 0 3px;

	@media (max-width: 600px) {
		border-width: 3px 0 0 0;
	}
}

.yaml-textarea {
	flex-grow: 1;
	width: 100%;
	display: flex;
	flex-direction: column;
}

.recipe-viewer {
	padding: 20px;

	.header {
		display: flex;
		align-items: stretch;

		@media (max-width: 600px) {
			flex-direction: column-reverse;
		}

		.info {
			flex: 1 0 50%;
			padding-right: 20px;

			.name {
				margin: 0 0 10px;
			}

			.desc {
				font-style: italic;
			}

			.tags {
				display: flex;
				flex-wrap: wrap;
				margin: 0;
				padding: 5px 0;

				li {
					display: block;
					padding: 4px 8px;
					margin: 5px 5px 5px 0;
					background: #cccccc;
					border-radius: 5px;
				}
			}

			.time {
				padding: 10px 0;
			}
		}

		.image {
			flex: 1 1 50%;
			width: 100%;
			background-position: center;
			background-size: contain;
			background-repeat: no-repeat;
			margin-bottom: 20px;

			@media (max-width: 600px) {
				min-height: 30vh;
			}
		}
	}

	.ingredients-container {
		.controls {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			justify-content: start;

			* {
				margin: 5px;
			}

			input {
				width: 100px;
			}
		}

		.ingredients {
			margin: 10px 5px;
			border-collapse: collapse;

			.ingredient {

				& > * {
					border: 2px solid black;
					padding: 5px;
				}

				.name {
					text-transform: capitalize;
					font-weight: bold;
				}

				.quantity {
					border-right: none;
				}

				.unit {
					border-left: none;
				}
			}
		}
	}

	.instructions {
		border-collapse: collapse;

		.instruction {
			& > * {
				border: 2px solid black;
				padding: 5px;
			}
		}
	}
}
</style>
