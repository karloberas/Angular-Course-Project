import { HttpClient } from '@angular/common/http';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as AuthActions from './auth.actions';
import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

export interface AuthResponseData {
    idToken: string;
    email: string;
    refreshToken: string;
    expiresIn: string;
    localId: string;
    registered?: string;
}

const handleAuthentication = (expiresIn: number, email: string, userId: string, token: string) => {
    const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
    return new AuthActions.AuthenticateSuccess({
        email,
        userId,
        token,
        expirationDate,
    });
};

const handleError = (errorRes: any) => {
    let errorMessage = 'An unknown error has occurred.';
    if (!errorRes.error || !errorRes.error.error) {
        return of(new AuthActions.AuthenticateFail(errorMessage));
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

    return of(new AuthActions.AuthenticateFail(errorMessage));
};

@Injectable()
export class AuthEffects {
    authSignup = createEffect(() => {
        return this.actions$.pipe(
            ofType(AuthActions.SIGNUP_START),
            switchMap((authData: AuthActions.SignupStart) => {
                return this.http
                    .post<AuthResponseData>(
                        'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + environment.firebaseAPIKey,
                        {
                            email: authData.payload.email,
                            password: authData.payload.password,
                            returnSecureToken: true,
                        }
                    )
                    .pipe(
                        map((response) => {
                            return handleAuthentication(
                                +response.expiresIn,
                                response.email,
                                response.localId,
                                response.idToken
                            );
                        }),
                        catchError((errorRes) => {
                            return handleError(errorRes);
                        })
                    );
            })
        );
    });

    authLogin = createEffect(() => {
        return this.actions$.pipe(
            ofType(AuthActions.LOGIN_START),
            switchMap((authData: AuthActions.LoginStart) => {
                return this.http
                    .post<AuthResponseData>(
                        'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' +
                            environment.firebaseAPIKey,
                        {
                            email: authData.payload.email,
                            password: authData.payload.password,
                            returnSecureToken: true,
                        }
                    )
                    .pipe(
                        map((response) => {
                            return handleAuthentication(
                                +response.expiresIn,
                                response.email,
                                response.localId,
                                response.idToken
                            );
                        }),
                        catchError((errorRes) => {
                            return handleError(errorRes);
                        })
                    );
            })
        );
    });

    authRedirect = createEffect(
        () => {
            return this.actions$.pipe(
                ofType(AuthActions.AUTHENTICATE_SUCCESS, AuthActions.LOGOUT),
                tap(() => {
                    this.router.navigate(['/']);
                })
            );
        },
        { dispatch: false }
    );

    constructor(private actions$: Actions, private http: HttpClient, private router: Router) {}
}
