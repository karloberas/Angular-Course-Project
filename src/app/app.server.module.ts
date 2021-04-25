import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';

@NgModule({
    imports: [
        AppModule,
        ServerModule, // required by Angular Universal to render the app on the server
    ],
    bootstrap: [AppComponent],
})
export class AppServerModule {}
