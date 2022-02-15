<template>
	<q-layout id="login">
		<app-bar header/>
		<q-form class="q-gutter-md column items-center" @submit="login">
			<h3 class="q-my-sm">YACL COOKBOOK</h3>
			<q-input v-model="email" label="E-mail" type="email"/>
			<q-input v-model="password" label="Password" type="password"/>
			<q-btn color="primary" label="Login" type="submit"/>
			<router-link :to="{name:'register'}">Don't have an account yet?</router-link>
		</q-form>
		<q-footer bordered class="bg-grey-14 q-px-sm q-py-xs text-left">
			Copyright &copy; 2019-{{ new Date().getFullYear() }}, Alessandro Contenti
		</q-footer>
	</q-layout>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import AppBar from "components/AppBar.vue";

@Component({
	components: {AppBar},
	meta: {
		titleTemplate: (title: string) => `${title} - Login`
	}
})
export default class Login extends Vue {
	email = "";
	password = "";
	redirect = this.$route.query.redirect as string;

	login() {
		this.$firebase.auth().signInWithEmailAndPassword(this.email, this.password).then(() => {
			this.$router.replace(!!this.redirect ? {path: this.redirect} : {name: "app"});
		}).catch(error => {
			if (error.code && error.message) {
				this.$q.dialog({type: "error", message: error.message});
			} else this.$q.dialog({type: "error", message: error.toString()});
		});
	}

	mounted() {
		const unsubscribe = this.$firebase.auth().onAuthStateChanged(user => {
			unsubscribe();
			if (user) {
				void this.$router.replace(this.redirect ? {path: this.redirect} : {name: "app"});
			}
		});
	}
};
</script>

<style lang="scss">
#login {
	display: flex;
	flex-direction: column;
	flex-grow: 1;
	align-items: center;
	justify-content: center;
	text-align: center;
}
</style>
