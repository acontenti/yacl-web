import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import firebaseConfig from "src/firebase-config";
import {boot} from "quasar/wrappers";

export default boot(({Vue, router}) => {
	const firebaseapp = firebase.initializeApp(firebaseConfig);
	firebaseapp.auth().onAuthStateChanged(user => {
		if (!user) {
			void router.replace({name: "login"});
		}
	});

	Vue.prototype.$firebase = firebaseapp;
	Vue.prototype.$logout = function () {
		firebaseapp.auth().signOut().catch(() => router.replace({name: "login"}));
	};
});

declare module "vue/types/vue" {
	interface Vue {
		$firebase: firebase.app.App;

		$logout(): void
	}
}
