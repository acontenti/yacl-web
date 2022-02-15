<template>
	<q-page>
		<q-table :data="recipes" :filter="category+search" :filter-method="filterMethod" :loading="loading"
			:pagination.sync="pagination" :rows-per-page-options="rowsPerPageOptions" :title="title"
			class="q-mx-md" grid loading-label="Loading recipes..." row-key="docId" title-class="text-h4">
			<template v-slot:top-right>
				<q-input v-model="search" clearable debounce="300" dense placeholder="Search">
					<template v-slot:append>
						<q-icon name="search" />
					</template>
				</q-input>
			</template>
			<template v-slot:item="props">
				<div class="q-pa-xs col-xs-12 col-sm-6 col-md-3 col-lg-2">
					<q-card v-ripple class="cursor-pointer"
						@click="$router.push({name:'recipe', params:{id:props.row.docId}})">
						<q-img :ratio="21/9" :src="props.row.image" basic
							placeholder-src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE1LjEuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9InBsYWNlaG9sZGVyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiCgkgeT0iMHB4IiB3aWR0aD0iNjAwcHgiIGhlaWdodD0iNDAwcHgiIHZpZXdCb3g9IjAgMCA2MDAgNDAwIiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCA2MDAgNDAwIiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHJlY3QgeD0iMCIgZmlsbD0iI0VERUNFQiIgd2lkdGg9IjYwMCIgaGVpZ2h0PSI0MDAiLz4KPHBhdGggZmlsbD0iI0ZGRkZGRiIgZD0iTTIzNC41MzksMTQ4LjV2MTAzaDEzMC45MjJ2LTEwM0gyMzQuNTM5eiBNMzU0LjkwOCwyNDAuMzNIMjQ1LjcwN3YtODAuNjYxaDEwOS4yMDFWMjQwLjMzTDM1NC45MDgsMjQwLjMzeiIKCS8+Cjxwb2x5Z29uIGZpbGw9IiNGRkZGRkYiIHBvaW50cz0iMjUxLjU4LDIzMS42NDMgMjc0LjA4OCwyMDcuOTg0IDI4Mi41MjEsMjExLjYzMyAzMDkuMTMsMTgzLjMwOCAzMTkuNjA0LDE5NS44MzYgMzI0LjMyOSwxOTIuOTgyIAoJMzQ5Ljg5OCwyMzEuNjQzICIvPgo8Y2lyY2xlIGZpbGw9IiNGRkZGRkYiIGN4PSIyNzcuNTgyIiBjeT0iMTgwLjE4IiByPSI5LjgzIi8+Cjwvc3ZnPgo=" />
						<q-card-section>
							<div class="text-h6">{{ props.row.name }}</div>
							<div class="text-subtitle2 text-uppercase">{{ props.row.category }}</div>
							<div class="text-caption">{{ props.row.description }}</div>
						</q-card-section>
						<q-separator />
					</q-card>
				</div>
			</template>
		</q-table>
	</q-page>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import {Recipe} from "src/util/model";
import jsyaml from "js-yaml";
import {NavigationGuardNext, Route} from "vue-router/types/router";
import firebase from "firebase";
import {format} from "quasar";
import DocumentData = firebase.firestore.DocumentData;
import QuerySnapshot = firebase.firestore.QuerySnapshot;
import capitalize = format.capitalize;

@Component({
	meta: {
		titleTemplate(title: string) { return `${title} - Recipes`; }
	}
})
export default class Home extends Vue {
	recipes: Recipe[] = [];
	columns = [
		{name: "name", label: "Name", field: "name"},
		{name: "description", label: "Description", field: "description"},
		{name: "category", label: "Category", field: "category"},
		{name: "tags", field: "tags"},
		{name: "image", field: "image"}
	];
	pagination = {
		page: 1,
		rowsPerPage: 0
	};
	unsubscribe: (() => void) | null = null;
	loading = false;
	search: string = (this.$route.query.search ?? "") as string;

	get category() {
		return this.$route.params.category ?? "";
	}

	get title() {
		if (this.category) {
			return "Recipes" + " \u2014 " + capitalize(this.category);
		} else return "Recipes";
	}

	get rowsPerPageOptions() {
		if (this.$q.screen.gt.xs) {
			if (this.$q.screen.gt.sm) {
				if (this.$q.screen.gt.md) {
					return [16, 24, 32, 0];
				}
				return [8, 12, 16, 0];
			}
			return [4, 8, 12, 0];
		}
		return [4, 8, 12, 0];
	}

	filterMethod(rows: Recipe[], _: any, cols: [], getCellValue: (col: object, row: object) => any) {
		if (this.category) {
			rows = rows.filter(value => value.category?.toLowerCase()?.localeCompare(this.category.toLowerCase()) === 0);
		}
		if (this.search) {
			rows = this.searchMethod(rows, this.search, cols, getCellValue);
		}
		return rows;
	}

	searchMethod(rows: Recipe[], terms: string, cols: [], getCellValue: (col: object, row: object) => any) {
		const lowerTerms = terms ? terms.toLowerCase() : "";
		return rows.filter(
			row => cols.some(col => {
				const val = getCellValue(col, row) + "";
				const haystack = (val === "undefined" || val === "null") ? "" : val.toLowerCase();
				return haystack.indexOf(lowerTerms) !== -1;
			})
		);
	}

	cleanup() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}

	loadData(querySnapshot: QuerySnapshot<DocumentData>) {
		this.loading = false;
		this.recipes = [];
		querySnapshot.forEach(doc => {
			try {
				const it = doc.data();
				const recipe = jsyaml.load(it.yacl) as Recipe | undefined;
				if (recipe) {
					recipe.docId = doc.id;
					this.recipes.push(recipe);
				}
			} catch (e) {
				console.debug(e);
			}
		});
		this.recipes.sort((a, b) => a.name?.localeCompare(b.name ?? "") ?? 0);
		this.loading = false;
	}

	mounted() {
		const user = this.$firebase.auth().currentUser;
		if (!user) {
			this.$logout();
			return;
		}
		this.loading = true;
		const db = this.$firebase.firestore();
		let recipesRef = db.collection("users").doc(user.uid).collection("recipes");
		recipesRef.get().then(querySnapshot => {
			this.loadData(querySnapshot);
		});
		this.unsubscribe = recipesRef.onSnapshot(snapshot => {
			this.loadData(snapshot);
		});
	}

	beforeRouteLeave(to: Route, from: Route, next: NavigationGuardNext) {
		this.cleanup();
		next();
	}

	beforeDestroy() {
		this.cleanup();
	}
}
</script>

<style lang="sass">
.grid-masonry
	flex-direction: column
	height: 700px

	&--2
		> div
			&:nth-child(2n + 1)
				order: 1

			&:nth-child(2n)
				order: 2

		&:before
			content: ''
			flex: 1 0 100% !important
			width: 0 !important
			order: 1

	&--3
		> div
			&:nth-child(3n + 1)
				order: 1

			&:nth-child(3n + 2)
				order: 2

			&:nth-child(3n)
				order: 3

		&:before,
		&:after
			content: ''
			flex: 1 0 100% !important
			width: 0 !important
			order: 2
</style>
