import {boot} from "quasar/wrappers";

declare module "vue/types/vue" {
	interface Vue {
		$sessionId: string;
	}
}

export default boot(({Vue}) => {
	Vue.prototype.$sessionId = Math.random().toString(36).substr(2, 9);
});
