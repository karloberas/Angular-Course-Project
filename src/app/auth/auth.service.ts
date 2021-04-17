import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User } from './user.model';
import { environment } from '../../environments/environment';
import { Store } from '@ngrx/store';
import * as fromApp from '../store/app.reducer';
import * as AuthActions from './store/auth.actions';

export interface AuthResponseData {
    idToken: string;
    email: string;
    refreshToken: string;
    expiresIn: string;
    localId: string;
    registered?: string;
}

@Injectable({providedIn: 'root'})
export class AuthService {
    // user = new BehaviorSubject<User>(null);
    private tokenExpirationTimer: any;

    constructor(private http: HttpClient, private router: Router, private store: Store<fromApp.AppState>) {}

    signUp(email: string, password: string) {
        return this.http.post<AuthResponseData>(
            'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + environment.firebaseAPIKey,
            {
                email,
                password,
                returnSecureToken: true
            }
        ).pipe(catchError(this.handleError), tap((response) => {
           this.handleAuthentication(response.email, response.localId, response.idToken, +response.expiresIn);
        }));
    }

    login(email: string, password: string) {
        return this.http.post<AuthResponseData>(
            'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + environment.firebaseAPIKey,
            {
                email,
                password,
                returnSecureToken: true
            }
        ).pipe(catchError(this.handleError), tap((response) => {
           this.handleAuthentication(response.email, response.localId, response.idToken, +response.expiresIn);
        }));
    }

    autoLogin() {
        const userData: {
            email: string,
            id: string,
            _token: string,
            _tokenExpirationDate: string
        } = JSON.parse(localStorage.getItem('userData'));

        if (!userData) {
            return;
        }

        const loadedUser = new User(userData.email, userData.id, userData._token, new Date(userData._tokenExpirationDate));
        if (loadedUser.token) {
            // this.user.next(loadedUser);
            this.store.dispatch(new AuthActions.AuthenticateSuccess({
                email: loadedUser.email,
                userId: loadedUser.id,
                token: loadedUser.token,
                expirationDate: new Date(userData._tokenExpirationDate)
            }));
            const expirationTime = new Date(userData._tokenExpirationDate).getTime() - new Date().getTime();
            this.autoLogout(expirationTime);
        }
    }

    logout() {
        // this.user.next(null);
        this.store.dispatch(new AuthActions.Logout());
        this.router.navigate(['/auth']);
        localStorage.removeItem('userData');
    }

    autoLogout(expirationDuration: number) {
        console.log(expirationDuration);
        this.tokenExpirationTimer = setTimeout(() => {
            this.logout();
        }, expirationDuration);
    }

    private handleError(errorRes: HttpErrorResponse) {
        let errorMessage = 'An unknown error has occurred.';
        if (!errorRes.error || !errorRes.error.error) {
            return throwError(errorMessage);
        }

        switch (errorRes.error.error.message) {
            case 'EMAIL_EXISTS': {
                errorMessage = 'The email address is already in use by another account.';
                break;
            }
            case 'EMAIL_NOT_FOUND': {
                errorMessage = 'The email is invalid.';
                break;
            }
            case 'INVALID_PASSWORD': {
                errorMessage = 'The password is invalid.';
            }
        }

        return throwError(errorMessage);
    }

    private handleAuthentication(email: string, userId: string, token: string, expiresIn: number) {
        const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
        // this.user.next(user);
        this.store.dispatch(new AuthActions.AuthenticateSuccess({
            email,
            userId,
            token,
            expirationDate
        }));
        this.autoLogout(expiresIn * 1000);
        const user = new User(email, userId, token, expirationDate);
        localStorage.setItem('userData', JSON.stringify(user));
    }
}
