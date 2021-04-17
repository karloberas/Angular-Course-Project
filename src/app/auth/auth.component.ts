import { Component, ComponentFactoryResolver, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { AuthResponseData, AuthService } from './auth.service';
import { AlertComponent } from '../shared/alert/alert.component';
import { PlaceholderDirective } from '../shared/placeholder/placeholder.directive';
import { Store } from '@ngrx/store';
import * as fromApp from '../store/app.reducer';
import * as AuthActions from './store/auth.actions';

@Component({
    selector: 'app-auth',
    templateUrl: './auth.component.html',
})
export class AuthComponent implements OnInit, OnDestroy {
    isLoginMode = true;
    isLoading = false;
    error: string = null;
    @ViewChild(PlaceholderDirective) alertHost: PlaceholderDirective;

    private closeSub: Subscription;

    constructor(private componentFactoryResolver: ComponentFactoryResolver, private store: Store<fromApp.AppState>) {}

    ngOnInit() {
        this.store.select('auth').subscribe((authState) => {
            this.isLoading = authState.loading;
            this.error = authState.authError;
            if (this.error) {
                this.showErrorAlert(this.error);
            }
        });
    }

    onSwitchMode() {
        this.isLoginMode = !this.isLoginMode;
    }

    onSubmit(f: NgForm) {
        if (f.invalid) {
            return;
        }

        const email = f.value.email;
        const password = f.value.password;

        if (this.isLoginMode) {
            // authSub = this.authService.login(email, password);
            this.store.dispatch(new AuthActions.LoginStart({ email, password }));
        } else {
            this.store.dispatch(new AuthActions.SignupStart({ email, password }));
        }

        f.reset();
    }

    onErrorHandled() {
        this.error = null;
    }

    private showErrorAlert(message: string) {
        const alertComponentFactory = this.componentFactoryResolver.resolveComponentFactory(AlertComponent);
        const hostViewContainerRef = this.alertHost.viewContainerRef;
        hostViewContainerRef.clear();
        const componentRef = hostViewContainerRef.createComponent(alertComponentFactory);
        componentRef.instance.message = message;
        this.closeSub = componentRef.instance.close.subscribe(() => {
            this.closeSub.unsubscribe();
            hostViewContainerRef.clear();
        });
    }

    ngOnDestroy() {
        if (this.closeSub) {
            this.closeSub.unsubscribe();
        }
    }
}
