import _Vue from "vue";

export default function SessionPlugin(Vue: typeof _Vue): void {
	Vue.prototype.$sessionId = Math.random().toString(36).substr(2, 9);
}

declare module "vue/types/vue" {
	interface Vue {
		$sessionId: string;
	}
}
