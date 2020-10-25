<template>
	<div id="home">
		<h1 class="title">YACL COOKBOOK</h1>
		<div id="login-container">
			<form @submit.prevent="login">
				<label>
					<span>e-mail</span>
					<input type="email" v-model="email"/>
				</label>
				<label>
					<span>password</span>
					<input type="password" v-model="password"/>
				</label>
				<button type="submit">login</button>
			</form>
		</div>
	</div>
</template>

<script>
	export default {
		name: "Home",
		data() {
			return {
				email: "",
				password: ""
			};
		},
		methods: {
			login() {
				this.$firebase.auth().signInWithEmailAndPassword(this.email, this.password).then(() => {
					this.$router.replace({name: "app"});
				}).catch(reason => {
					console.debug(reason);
					this.$swal("Error", reason);
				});
			}
		}
	};
</script>

<style lang="scss">
	#home {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
	}

	#login-container {
		display: flex;
		margin: 5px;
		flex-grow: 1;
	}

	form {
		margin: auto;
		display: flex;
		flex-direction: column;
		align-items: center;

		label {
			display: block;
			margin: 10px;
		}

		input, button {
			display: block;
		}

		button {
			margin: 10px;
			flex-grow: 0;
		}
	}
</style>
