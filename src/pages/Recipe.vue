<template>
	<q-page id="editor" padding>
		<portal to="toolbar">
			<q-btn v-if="pendingChanges" flat icon="save" round @click="saveRecipe(true)">
				<q-tooltip>Save recipe</q-tooltip>
			</q-btn>
			<q-btn v-else flat icon="edit" round @click="editRecipe">
				<q-tooltip>Edit recipe source</q-tooltip>
			</q-btn>
			<q-btn flat icon="delete" round @click="deleteRecipe">
				<q-tooltip>Delete recipe</q-tooltip>
			</q-btn>
		</portal>
		<codemirror v-if="pendingChanges" v-model="yaml" :options="cmOptions" class="yaml-textarea" />
		<div v-if="recipe && !pendingChanges" class="recipe-viewer">
			<div class="header">
				<div class="info">
					<div class="name text-h4">{{ recipe.name }}</div>
					<div class="desc text-subtitle1">{{ recipe.description }}</div>
					<div class="tags">
						<router-link v-for="(tag, i) in recipe.tags" :key="'tag-' + i"
							:to="{name:'app', query:{search:tag}}" style="text-decoration: none">
							<q-chip :label="tag" clickable icon="local_offer" />
						</router-link>
					</div>
					<div class="quantity"><strong>Quantity: </strong>{{ quantity }}</div>
					<div class="category"><strong>Category: </strong>{{ recipe.category }}</div>
					<div class="category"><strong>Cuisine: </strong>{{ recipe.cuisine }}</div>
					<div class="source"><strong>Source: </strong><span v-html="recipeSource" /></div>
					<div v-if="getTotalTime() > 0" class="time">
						<q-chip icon="timer"><strong>Total time:&nbsp;</strong>{{ getTotalTime() | formatDuration }}
						</q-chip>
						<q-chip v-if="getTime('prep') > 0" :icon="getTypeIcon('prep')" class="q-px-sm" dense>
							<strong>Preparation time:&nbsp;</strong>{{ getTime("prep") | formatDuration }}
						</q-chip>
						<q-chip v-if="getTime('cook') > 0" :icon="getTypeIcon('cook')" class="q-px-sm" dense>
							<strong>Cooking time:&nbsp;</strong>{{ getTime("cook") | formatDuration }}
						</q-chip>
						<q-chip v-if="getTime('wait') > 0" :icon="getTypeIcon('wait')" class="q-px-sm" dense>
							<strong>Waiting time:&nbsp;</strong>{{ getTime("wait") | formatDuration }}
						</q-chip>
					</div>
				</div>
				<q-img v-if="recipe.image" :ratio="21/9" :src="recipe.image" class="q-mb-md" contain />
			</div>
			<div :class="{row: $q.screen.gt.sm}" class="no-wrap items-start">
				<q-table v-if="recipe.ingredients" :columns="ingredientsColumns" :data="ingredients"
					:rows-per-page-options="[0]" :selected.sync="selectedIngredients" bordered
					class="q-mx-md q-mb-md" flat hide-bottom hide-header row-key="id" selection="multiple"
					separator="cell" style="min-width: 350px" table-header-class="text-uppercase">
					<template v-slot:top-left>
						<h4 class="q-mt-none q-mb-sm">Ingredients</h4>
					</template>
					<template v-slot:top-right>
						<q-toolbar>
							<q-btn-toggle v-model="mode"
								:options="[{label:'Original', value:null},{label:'Metric', value: 'metric'}]"
								class="q-mr-md" color="white" rounded
								style="border: 1px solid var(--q-color-primary)" text-color="primary"
								toggle-color="primary" unelevated />
							<q-input v-model.number="scaleFactor" dense label="Scale:" max="100" min="0" outlined
								step="0.25" type="number" />
						</q-toolbar>
					</template>
					<template v-slot:body="props">
						<q-tr v-if="props.row.sectionFirst" :key="`s_${props.row.id}`" :props="props" no-hover>
							<q-td colspan="100%">
								<div class="text-subtitle1 text-uppercase text-bold">
									Section {{ props.row.sectionIndex }}
								</div>
							</q-td>
						</q-tr>
						<q-tr :key="`i_${props.row.id}`" :props="props">
							<q-td auto-width>
								<q-checkbox v-model="props.selected" />
							</q-td>
							<q-td key="name" :props="props" auto-width>
								<div class="text-subtitle1">{{ props.row.name }}</div>
							</q-td>
							<q-td key="quantity" :props="props">
								<div class="text-subtitle1">{{ props.row.quantity }}</div>
							</q-td>
						</q-tr>
					</template>
				</q-table>
				<q-timeline v-if="recipe.instructions"
					class="q-px-lg q-my-none q-py-md q-table--bordered q-table__card q-table--flat"
					style="width: auto;">
					<q-timeline-entry heading tag="div">
						<div class="text-h4 inline-block">Instructions</div>
						<q-input :value="startTime" class="q-ml-lg q-pa-none inline-block"
							hide-bottom-space label="Start time:" mask="time" outlined readonly>
							<template v-slot:prepend>
								<q-icon class="cursor-pointer" name="access_time" />
							</template>
							<q-popup-proxy cover transition-hide="scale" transition-show="scale">
								<q-time v-model="startTime" format24h now-btn>
									<div class="row items-center justify-end">
										<q-btn v-close-popup color="primary" flat label="Close" />
									</div>
								</q-time>
							</q-popup-proxy>
						</q-input>
					</q-timeline-entry>
					<q-timeline-entry v-for="instruction in instructions" :key="instruction.index"
						:icon="instruction.typeIcon">
						<template v-slot:subtitle>
							<div class="full-width flex flex-center" style="margin-top: -5px">
								<span class="text-subtitle1 text-bold">Step {{ instruction.index }}</span>
								<q-chip v-if="instruction.time" class="q-ml-sm" dense icon="timer">
									{{ instruction.time | parseTime | formatDuration }}
								</q-chip>
								<q-chip class="q-ml-auto q-mr-xs" dense icon="schedule">
									{{ instruction.startTime }}
								</q-chip>
							</div>
						</template>
						<template v-slot:default>
							<div class="text-body1 q-mb-md">{{ instruction.text || instruction }}</div>
						</template>
					</q-timeline-entry>
				</q-timeline>
			</div>
		</div>
	</q-page>
</template>

<script lang="ts">
import {codemirror} from "vue-codemirror";
import "codemirror/mode/yaml/yaml";
import "codemirror/lib/codemirror.css";
import jsyaml from "js-yaml";
import parseTime from "parse-duration";
import Utils from "src/util/utils";
import {Component, Vue} from "vue-property-decorator";
import humanizeDuration from "humanize-duration";
import {Instruction, InstructionType, Recipe} from "src/util/model";
import {NavigationGuardNext, Route} from "vue-router/types/router";
import {EditorConfiguration} from "codemirror";
import {Autolinker} from "autolinker";
import {date} from "quasar";

interface InstructionInfo extends Instruction {
	index: number;
	startTime: string;
	typeIcon: string;
}

@Component<RecipeComponent>({
	components: {
		codemirror
	},
	meta() {
		return {
			titleTemplate: (title: string) => `${title} - ${this.title}`
		};
	},
	filters: {
		parseTime(time: string) {
			return time ? parseTime(time) : undefined;
		},
		formatDuration(millis: number) {
			if (millis && millis > 0)
				return humanizeDuration(millis);
			else return undefined;
		}
	}
})
export default class RecipeComponent extends Vue {
	id: string | null = null;
	yaml: string | null = null;
	recipe: Recipe | null = null;
	pendingChanges = false;
	scaleFactor = 1;
	startTime = date.formatDate(new Date(), "HH:mm");
	mode: string | null = null;
	cmOptions: EditorConfiguration = {
		mode: "yaml",
		readOnly: false,
		lineNumbers: true
	};
	selectedIngredients = [];
	ingredientsColumns = [
		{
			name: "id",
			field: "id"
		},
		{
			name: "name",
			label: "Name",
			field: "name",
			align: "left",
			classes: "text-bold text-capitalize"
		},
		{
			name: "quantity",
			label: "Quantity",
			field: "quantity",
			align: "left"
		}
	];
	unsubscribe: (() => void) | null = null;
	title = "";

	get quantity() {
		let quantity = this.recipe?.quantity;
		if (!quantity) return "";
		return quantity.toString().replace(/\d+/g, n => {
			return (Number(n) * this.scaleFactor).toString();
		});
	}

	get ingredients() {
		if (!this.recipe?.ingredients) return [];
		let ingredients = Array.isArray(this.recipe.ingredients) ? this.recipe.ingredients : [this.recipe.ingredients];
		return ingredients.map((section, si) => Object.entries(section).map(([name, quantity], index) => ({
			id: si + ":" + name,
			name: name,
			quantity: this.computedQuantity(quantity) + " " + this.computedUnit(quantity),
			sectionIndex: si + 1,
			...(index == 0 && ingredients.length > 1 ? {sectionFirst: true} : {})
		}))).reduce((previousValue, currentValue) => previousValue.concat(currentValue), []);
	}

	get instructions(): InstructionInfo[] {
		if (!this.recipe?.instructions) return [];
		return this.recipe.instructions.map((value, index) => {
			let item: Instruction = RecipeComponent.isInstruction(value) ? value : {text: value};
			return <InstructionInfo>{
				index: index + 1,
				text: item.text,
				time: item.time,
				startTime: date.formatDate(this.getRunningTime(index) + date.extractDate(this.startTime, "HH:mm").getTime(), "HH:mm"),
				type: item.type,
				typeIcon: this.getTypeIcon(item.type)
			};
		});
	}

	get recipeSource() {
		if (this.recipe?.source) {
			return Autolinker.link(this.recipe.source, {
				email: false,
				hashtag: false,
				mention: false,
				phone: false,
				sanitizeHtml: true,
				newWindow: true,
				stripPrefix: false,
				className: "text-lowercase"
			});
		} else {
			return "unknown";
		}
	}

	static isInstruction(it: Instruction | string): it is Instruction {
		return typeof it !== "string";
	}

	getTotalTime(): number {
		return this.getTime("prep") + this.getTime("cook") + this.getTime("wait");
	}

	getTime(type: InstructionType): number {
		return this.recipe?.instructions?.reduce<number>((last: number, it: Instruction | string) => {
			if (RecipeComponent.isInstruction(it) && it.time && it.type === type) {
				return last + (parseTime(it.time) ?? 0);
			} else return last;
		}, 0) ?? 0;
	}

	getRunningTime(to: number): number {
		return this.recipe?.instructions?.slice(0, to).reduce<number>((last: number, it: Instruction | string) => {
			if (RecipeComponent.isInstruction(it) && it.time) {
				return last + (parseTime(it.time) ?? 0);
			} else return last;
		}, 0) ?? 0;
	}

	getTypeIcon(type?: InstructionType) {
		switch (type) {
			case "cook":
				return "microwave";
			case "prep":
				return "local_dining";
			case "wait":
				return "hourglass_empty";
			default:
				return null;
		}
	}

	computedQuantity(quantity?: string) {
		if (!quantity) return "as needed";
		let [value_, ...unit_] = quantity.toString().split(" ");
		if (!value_) return "";
		const unit = unit_.join(" ");
		let value = Number.parseFloat(value_);
		if (unit) {
			if (this.mode === "metric") {
				value = Utils.toMetricValue(unit, value);
			}
		}
		return Utils.round(value * this.scaleFactor);
	}

	computedUnit(quantity?: string) {
		if (!quantity) return "";
		const unit = quantity.toString().split(" ")[1];
		if (unit) {
			if (this.mode === "metric") {
				return Utils.toMetricUnit(unit);
			}
			return unit;
		} else return "";
	}

	loadRecipe() {
		this.recipe = jsyaml.load(this.yaml ?? "") as Recipe | null;
		this.title = this.recipe?.name ?? "";
	}

	async save() {
		if (this.pendingChanges) {
			const db = this.$firebase.firestore();
			const user = this.$firebase.auth().currentUser;
			if (!user || !this.id) {
				this.$logout();
				return;
			}
			try {
				this.loadRecipe();
			} catch ({message}) {
				this.$q.dialog({
					title: "Cannot save recipe",
					message: `<pre class="exception">Error:<br>${message}</pre>`,
					html: true,
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
	}

	async saveRecipe(showDialog = false) {
		if (showDialog) {
			this.$q.loading.show({message: "Saving"});
			const result = await this.save();
			this.$q.loading.hide();
			return result;
		} else {
			return await this.save();
		}
	}

	showChangesDialog() {
		return new Promise(resolve => {
			let dialog = this.$q.dialog({
				title: "Unsaved recipe",
				message: "You have pending changes in currently open recipe",
				type: "warning",
				cancel: "Cancel",
				ok: "Save and continue"
			}).onOk(async () => {
				dialog.update({
					ok: false,
					cancel: false,
					progress: true
				});
				resolve(await this.saveRecipe());
			}).onCancel(() => {
				resolve(false);
			});
		});
	}

	async closeRecipe() {
		if (this.pendingChanges) {
			if (!(await this.showChangesDialog()))
				return;
		}
		await this.$router.push({name: "app"});
	}

	async doDelete() {
		const db = this.$firebase.firestore();
		const user = this.$firebase.auth().currentUser;
		if (!user || !this.id) {
			this.$logout();
			return;
		}
		await db.collection("users").doc(user.uid).collection("recipes").doc(this.id).delete();
		this.pendingChanges = false;
	}

	deleteRecipe() {
		let dialog = this.$q.dialog({
			title: "Delete recipe",
			message: "Are you really sure? No going back after this!",
			type: "warning",
			ok: "Delete",
			cancel: true,
			noBackdropDismiss: true,
			noEscDismiss: true
		}).onOk(async () => {
			dialog.update({
				ok: false,
				cancel: false,
				progress: true
			});
			await this.doDelete();
			this.$q.dialog({
				title: "Recipe deleted",
				type: "success"
			});
			await this.closeRecipe();
		});
	}

	editRecipe() {
		const db = this.$firebase.firestore();
		const user = this.$firebase.auth().currentUser;
		if (!user || !this.id) {
			this.$logout();
			return;
		}
		const userDoc = db.collection("users").doc(user.uid);
		const docReference = userDoc.collection("recipes").doc(this.id);
		docReference.get().then(async doc => {
			const it = doc.data();
			if (it && it.locked && it.locked !== "" && it.locked !== this.$sessionId) {
				const session = await userDoc.collection("sessions").doc(it.locked).get();
				if (!session.exists) {
					await docReference.update({locked: ""});
					this.pendingChanges = true;
				} else {
					this.$q.dialog({
						title: "Cannot open recipe",
						message: "This recipe is being edited on another instance of YACL Cookbook",
						type: "error"
					});
				}
			} else {
				this.pendingChanges = true;
			}
		});
	}

	cleanup() {
		if (this.unsubscribe) {this.unsubscribe();}
		if (this.pendingChanges) {
			const db = this.$firebase.firestore();
			const user = this.$firebase.auth().currentUser;
			if (user && this.id) {
				db.collection("users").doc(user.uid).collection("recipes").doc(this.id).update({
					locked: ""
				});
			}
		}
	}

	init(to: Route | null = null) {
		this.id = (to ?? this.$route).params.id;
		this.yaml = "";
		this.recipe = null;
		this.pendingChanges = false;
		const db = this.$firebase.firestore();
		const docId = this.id;
		const user = this.$firebase.auth().currentUser;
		if (!user) {
			this.$logout();
			return;
		}
		const userDoc = db.collection("users").doc(user.uid);
		const docReference = userDoc.collection("recipes").doc(docId);
		docReference.get().then(doc => {
			const it = doc.data();
			if (it) {
				this.yaml = it.yacl;
				this.loadRecipe();
			}
		});
		this.unsubscribe = docReference.onSnapshot(doc => {
			if (!this.pendingChanges && !doc.metadata.hasPendingWrites) {
				const it = doc.data();
				if (it && it.locked && it.locked !== "" && it.locked !== this.$sessionId) {
					this.$q.dialog({
						title: "Locking editing",
						message: "This recipe is being edited on another instance of YACL Cookbook",
						type: "warning"
					});
					this.cmOptions.readOnly = true;
				} else {
					if (this.cmOptions.readOnly) {
						this.cmOptions.readOnly = false;
						this.$q.dialog({
							title: "Unlocking editing",
							message: "You can now edit this recipe",
							type: "success"
						});
					}
				}
				if (it) {
					this.yaml = it.yacl;
					this.loadRecipe();
				}
			}
		});

	}

	mounted() {
		this.init();
	}

	beforeRouteUpdate(to: Route, from: Route, next: NavigationGuardNext) {
		this.init(to);
		next();
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
#editor {
	display: flex;
	flex-direction: column;
}

.yaml-textarea {
	flex-grow: 1;
	width: 100%;
	display: flex;
	flex-direction: column;
}

.recipe-viewer {

	.header {
		display: flex;
		padding: 20px;
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
			}

			.tags {
				display: flex;
				flex-wrap: wrap;
				margin: 0;
				padding: 5px 0;
			}

			.time {
				padding: 10px 0;
				display: flex;
				flex-direction: column;
				align-items: flex-start;
			}
		}
	}
}
</style>
<style lang="scss">
.CodeMirror {
	flex-grow: 1;
}

.q-timeline__subtitle {
	opacity: 1 !important;
}
</style>
