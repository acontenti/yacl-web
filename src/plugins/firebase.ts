import _Vue from "vue";
import * as firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import firebaseConfig from "@/firebase-config";
import router from "@/router/router";

const firebaseapp = firebase.initializeApp(firebaseConfig);
firebaseapp.auth().onAuthStateChanged(user => {
	if (user) {
		router.replace({name: "app"});
	} else {
		router.replace({name: "home"});
	}
});

export default function FirebasePlugin(Vue: typeof _Vue): void {
	Vue.prototype.$firebase = firebaseapp;
}

declare module "vue/types/vue" {
	interface Vue {
		$firebase: firebase.app.App;
	}
}
