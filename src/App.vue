<template>
	<div id="q-app">
		<router-view/>
	</div>
</template>
<script lang="ts">
import {Component, Vue} from "vue-property-decorator";

@Component({
	meta: {
		title: "YACL"
	}
})
export default class App extends Vue {}
</script>
