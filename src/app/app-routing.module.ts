import { NgModule } from "@angular/core";
import { PreloadAllModules, RouterModule, Routes } from "@angular/router";
import { AuthenticationGuard } from "./guards/authentication.guard";
import { AutoLoginGuard } from "./guards/auto-login.guard";
import { SuperuserGuard } from "./guards/superuser.guard";

const routes: Routes = [
	{
		path: "",
		redirectTo: "login",
		pathMatch: "full",
	},
	{
		path: "app-settings",
		loadChildren: () =>
			import("./pages/su/app-settings/app-settings.module").then(
				(m) => m.AppSettingsPageModule
			),
		canLoad: [SuperuserGuard],
	},
	{
		path: "home",
		loadChildren: () =>
			import("./pages/home/home.module").then((m) => m.HomePageModule),
		canLoad: [AuthenticationGuard],
	},
	{
		path: "login",
		loadChildren: () =>
			import("./pages/login/login.module").then((m) => m.LoginPageModule),
		canLoad: [AutoLoginGuard],
	},
	{
		path: "school-settings",
		loadChildren: () =>
			import("./pages/school-settings/school-settings.module").then(
				(m) => m.SchoolSettingsPageModule
			),
		canLoad: [AuthenticationGuard],
	},
	{
		path: "students",
		loadChildren: () =>
			import("./pages/students/students.module").then(
				(m) => m.StudentsPageModule
			),
		canLoad: [AuthenticationGuard],
	},
];

@NgModule({
	imports: [
		RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
	],
	exports: [RouterModule],
})
export class AppRoutingModule {}
