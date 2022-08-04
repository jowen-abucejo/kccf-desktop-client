import { HttpErrorResponse } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { AlertController, LoadingController } from "@ionic/angular";
import { loadingController } from "@ionic/core";
import { Credentials } from "src/app/interfaces/app-configuration";
import { AuthenticationService } from "src/app/services/authentication.service";

@Component({
	selector: "app-login",
	templateUrl: "./login.page.html",
	styleUrls: ["./login.page.scss"],
})
export class LoginPage implements OnInit {
	password_regex = new RegExp(
		"^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"
	);
	loginFormGroup = new FormGroup({
		unameCtrl: new FormControl("", [Validators.required, Validators.email]),
		passCtrl: new FormControl("", [
			Validators.required,
			Validators.pattern(this.password_regex),
		]),
	});

	constructor(
		private auth: AuthenticationService,
		private router: Router,
		private loadingController: LoadingController,
		private alertController: AlertController
	) {}
	ionViewDidLeave(): void {
		this.loginFormGroup.get("unameCtrl").setValue("");
		this.loginFormGroup.get("passCtrl").setValue("");
	}

	ngOnInit() {}

	async login() {
		const loading = await loadingController.create({
			spinner: "bubbles",
			backdropDismiss: false,
		});
		await loading.present();

		let credentials: Credentials = {
			username: this.loginFormGroup.get("unameCtrl").value,
			password: this.loginFormGroup.get("passCtrl").value,
		};

		//check if user is superuser
		let isSuperuser = await this.auth.isSuperuser(credentials);

		if (isSuperuser) {
			await loading.dismiss();
			this.router.navigateByUrl("app-settings");
		} else {
			await this.auth.login(credentials).then(
				async (res) => {
					await loading.dismiss();
					this.router.navigateByUrl("home", { replaceUrl: true });
				},
				async (res: HttpErrorResponse) => {
					await loading.dismiss();
					const alert = await this.alertController.create({
						header: res.error.error,
						message: res.error.message,
						buttons: ["OK"],
					});
					await alert.present();
				}
			);
		}
	}
}
