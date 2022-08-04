import { Component, HostListener } from "@angular/core";
import { Router } from "@angular/router";
import { LoadingController } from "@ionic/angular";
import { map } from "rxjs/operators";
import { AuthenticationService } from "./services/authentication.service";
import { StorageService } from "./services/storage.service";
@Component({
	selector: "app-root",
	templateUrl: "app.component.html",
	styleUrls: ["app.component.scss"],
})
export class AppComponent {
	@HostListener("window:resize", ["$event"])
	onResize() {
		this.canShowPane = window.innerWidth >= 1200; //check if on lg screens
	}

	isAuthenticated = true;
	disabled = false;
	canShowPane = true;

	constructor(
		private auth: AuthenticationService,
		private loadingController: LoadingController,
		private router: Router,
		private storage: StorageService
	) {
		this.auth.isAuthenticated
			.pipe(
				map((isAuthenticated) => {
					this.isAuthenticated = isAuthenticated;
				})
			)
			.subscribe();
	}

	async ngOnInit() {}

	/**
	 * Logout the current user, revoked the access token and unload all secured routes
	 */
	async logout() {
		const loading = await this.loadingController.create({
			spinner: "bubbles",
			message: "Please wait...",
		});
		await loading.present();

		//revoke token on api server
		await this.auth.logout().then(
			(err) => {
				this.router
					.navigateByUrl("login", { replaceUrl: true })
					.finally(async () => {
						await loading.dismiss();
						window.location.reload();
					});
			},
			(err) => {
				loading.dismiss();
			}
		);
	}

	/**
	 * Toggle the split pane if active or not
	 */
	togglePane() {
		this.disabled = !this.disabled;
	}
}
