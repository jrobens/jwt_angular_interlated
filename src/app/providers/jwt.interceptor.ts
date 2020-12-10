import {Injectable} from '@angular/core';
import {HttpRequest, HttpHandler, HttpEvent, HttpInterceptor} from '@angular/common/http';
import {Observable, Subscription, throwError} from 'rxjs';

import {environment} from '../../environments/environment';
import {AuthenticationService} from '../authentication.service';
import {catchError, switchMap} from 'rxjs/operators';

// Started here https://jasonwatmore.com/post/2020/04/19/angular-9-jwt-authentication-example-tutorial

// Here is an expired token for testing
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authenticationService: AuthenticationService) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // add auth header with jwt if user is logged in and request is to the api url
    const currentUser = this.authenticationService.currentUserValue;
    const isLoggedIn = currentUser && currentUser.token;
    const isApiUrl = request.url.startsWith(environment.data_host);

    if (isApiUrl && !isLoggedIn && !request.url.endsWith('/jwt/token')) {
      console.log('No JWT key stored. Go find one.');
      return this.authenticationService.refreshToken().pipe(
        switchMap(() => {
          request = this.authenticationService.addAuthHeader(request);
          return next.handle(request);
        })).pipe(catchError(this.errorHandler));
    } else if (isApiUrl && isLoggedIn && !request.url.endsWith('/jwt/token')) {
      request = this.authenticationService.addAuthHeader(request);
      console.log('running authenticated request ' + JSON.stringify(request));
      return next.handle(request);
    } else {
      return next.handle(request);
    }
  }

  errorHandler(error) {
    let errorMessage = '';
    // this.log('bond data failed to load');
    if (error.error instanceof ErrorEvent) {
      // Get client-side error
      errorMessage = error.error.message;
    } else {
      // Get server-side error
      errorMessage = ` Error on refreshing token Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(errorMessage);
  }
}
