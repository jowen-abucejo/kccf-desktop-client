import { Component, OnInit } from "@angular/core";
import {
	AbstractControl,
	FormControl,
	FormGroup,
	ValidationErrors,
	Validators,
} from "@angular/forms";
import { AlertController } from "@ionic/angular";
import {
	ApiConfiguration,
	Credentials,
} from "src/app/interfaces/app-configuration";
import { AuthenticationService } from "src/app/services/authentication.service";
import { ConfigurationService } from "src/app/services/configuration.service";

/**
 * Check if control match the value of given control name
 * @param matchTo  name of the control to match to
 * @returns true if values are the same and false if not
 */
export function matchValues(
	matchTo: string
): (AbstractControl) => ValidationErrors | null {
	return (control: AbstractControl): ValidationErrors | null => {
		return !!control.parent &&
			!!control.parent.value &&
			control.value === control.parent.controls[matchTo].value
			? null
			: { isMatch: false };
	};
}

@Component({
	selector: "app-app-settings",
	templateUrl: "./app-settings.page.html",
	styleUrls: ["./app-settings.page.scss"],
})
export class AppSettingsPage implements OnInit {
	apiConfigFormGroup: FormGroup = new FormGroup({
		api_domain: new FormControl("", Validators.required),
		api_version: new FormControl("", Validators.required),
	});

	superUserFormGroup: FormGroup = new FormGroup({
		username: new FormControl(""),
		password: new FormControl(""),
		confirm_password: new FormControl("", matchValues("password")),
	});
	constructor(
		private config: ConfigurationService,
		private auth: AuthenticationService,
		private alertController: AlertController
	) {}

	ionViewDidLeave(): void {
		this.auth.isSuAuthenticated.next(false);
	}

	ngOnInit() {
		this.displayApi();
		this.displaySuperUser();
		this.superUserFormGroup.controls.password.valueChanges.subscribe(() => {
			this.superUserFormGroup.controls.confirm_password.updateValueAndValidity();
		});
	}

	/**
	 * Load the default api and superuser configuration
	 */
	async resetConfig() {
		await this.config.loadDefaultSuperuser();
		await this.config.loadDefaultApi(true);
	}

	/**
	 * Set the api configuration
	 */
	setApi() {
		let api_config: ApiConfiguration;
		const api_domain = this.apiConfigFormGroup.get("api_domain");
		const api_version = this.apiConfigFormGroup.get("api_version");

		api_config = { domain: api_domain.value, version: api_version.value };

		this.config.configureApi(api_config).then(
			async () => {
				this.auth.api.next({
					domain: api_domain.value,
					version: api_version.value,
				});
				api_domain.markAsPristine();
				api_version.markAsPristine();

				const alert = await this.alertController.create({
					header: "API Saved",
					message: "The api was updated successfully.",
					buttons: ["OK"],
				});
				await alert.present();
			},
			async (err) => {
				const alert = await this.alertController.create({
					header: "API Failed to Save!",
					message: "Please try again.",
					buttons: ["OK"],
				});
				await alert.present();
			}
		);
	}

	/**
	 * Set the superuser account credentials
	 */
	setSuperUser() {
		let superuser: Credentials;
		const su_name = this.superUserFormGroup.get("username");
		const su_pass = this.superUserFormGroup.get("password");
		const su_pass_confirm = this.superUserFormGroup.get("confirm_password");

		superuser = { username: su_name.value, password: su_pass.value };

		this.config.configureSuperUser(superuser).then(
			async () => {
				su_name.markAsPristine();
				su_pass.markAsPristine();
				su_pass_confirm.markAsPristine();
				const alert = await this.alertController.create({
					header: "Superuser Account Updated",
					message: "The account credentials was updated successfully",
					buttons: ["OK"],
				});
				await alert.present();
			},
			async (err) => {
				const alert = await this.alertController.create({
					header: "Superuser Account Failed to Update!",
					message: "Please try again.",
					buttons: ["OK"],
				});
				await alert.present();
			}
		);
	}

	/**
	 * Display the api configuration
	 */
	async displayApi() {
		let api: ApiConfiguration = await this.config.getApiConfiguration();
		this.apiConfigFormGroup.get("api_domain").setValue(api.domain);
		this.apiConfigFormGroup.get("api_version").setValue(api.version);
	}

	/**
	 * Display the superuser credentials
	 */
	async displaySuperUser() {
		let su: Credentials = await this.config.getSuperUser();
		this.superUserFormGroup.get("username").setValue(su.username);
		this.superUserFormGroup.get("password").setValue(su.password);
	}
}
