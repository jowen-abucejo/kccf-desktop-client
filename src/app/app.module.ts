import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { RouteReuseStrategy } from "@angular/router";

import { IonicModule, IonicRouteStrategy } from "@ionic/angular";
import { IonicStorageModule } from "@ionic/storage-angular";
import { HttpClientModule } from "@angular/common/http";

import { AppComponent } from "./app.component";
import { AppRoutingModule } from "./app-routing.module";

import { DataTablesModule } from "angular-datatables";
import { Drivers } from "@ionic/storage";
import { navCustomAnimation } from "./animations/nav-animation";

@NgModule({
	declarations: [AppComponent],
	imports: [
		BrowserModule,
		IonicModule.forRoot({
			navAnimation: navCustomAnimation,
		}),
		AppRoutingModule,
		DataTablesModule,
		IonicStorageModule.forRoot({
			name: "__kccfDB",
			driverOrder: [
				//   cordovaSQLiteDriver._driver,
				Drivers.IndexedDB,
				Drivers.LocalStorage,
			],
		}),
		HttpClientModule,
	],
	providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
	bootstrap: [AppComponent],
})
export class AppModule {}
