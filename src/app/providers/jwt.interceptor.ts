import {Injectable} from '@angular/core';
import {HttpRequest, HttpHandler, HttpEvent, HttpInterceptor} from '@angular/common/http';
import {Observable} from 'rxjs';

import {environment} from '../../environments/environment';
import {AuthenticationService} from '../authentication.service';

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

    if (isApiUrl && !isLoggedIn) {
      if (!request.url.endsWith('/jwt/token')) {
        console.log('Didn\'t find a jwt key');
        this.authenticationService.refreshToken().subscribe(data => {
          request = this.authenticationService.addAuthHeader(request);
        });
      }
    }
    // isLoggedIn will filter out the jwt request.
    if (isLoggedIn && isApiUrl && !request.url.endsWith('/jwt/token')) {
      // Same as this.authenticationService.addAuthHeader
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${currentUser.token}`
        }
      });
    }

    // Testing only
/*    if (!request.url.endsWith(('/jwt/token'))) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${oldToken}`
        }
      });
    }*/

    return next.handle(request);
  }
}
