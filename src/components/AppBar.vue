<template>
	<q-header v-if="header && $q.electron">
		<q-bar class="q-electron-drag">
			<q-icon name="local_dining"/>
			<div>YACL</div>
			<q-space/>
			<q-btn dense flat icon="minimize" @click="minimize"/>
			<q-btn dense flat icon="crop_square" @click="maximize"/>
			<q-btn dense flat icon="close" @click="closeApp"/>
		</q-bar>
	</q-header>
	<q-bar v-else-if="$q.electron" class="q-electron-drag">
		<q-icon name="laptop_chromebook"/>
		<div>YACL</div>
		<q-space/>
		<q-btn dense flat icon="minimize" @click="minimize"/>
		<q-btn dense flat icon="crop_square" @click="maximize"/>
		<q-btn dense flat icon="close" @click="closeApp"/>
	</q-bar>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";

@Component
export default class AppBar extends Vue {
	@Prop({type: Boolean, default: false}) header!: boolean;

	minimize() {
		if (process.env.MODE === "electron") {
			this.$q.electron.remote.BrowserWindow.getFocusedWindow()?.minimize();
		}
	}

	maximize() {
		if (process.env.MODE === "electron") {
			const win = this.$q.electron.remote.BrowserWindow.getFocusedWindow();
			if (win?.isMaximized()) {
				win?.unmaximize();
			} else {
				win?.maximize();
			}
		}
	}

	closeApp() {
		if (process.env.MODE === "electron") {
			this.$q.electron.remote.BrowserWindow.getFocusedWindow()?.close();
		}
	}
}
</script>
