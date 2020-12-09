import {Injectable} from '@angular/core';
import {HttpRequest, HttpHandler, HttpEvent, HttpInterceptor} from '@angular/common/http';
import {EMPTY, Observable, of, throwError} from 'rxjs';
import {catchError, retry, retryWhen, switchMap} from 'rxjs/operators';

import {AuthenticationService} from '../authentication.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private authenticationService: AuthenticationService) {
  }

  // retywhen e.g.
// https://stackoverflow.com/questions/54733093/angular-http-interceptor-to-retry-requests-with-specific-error-status


  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError(err => {
        // TODO check refresh. Check for multiple running at once.
        return this.authenticationService.refreshToken().pipe(
          switchMap(() => {
            request = this.authenticationService.addAuthHeader(request);
            return next.handle(request);
          })).pipe(catchError(this.errorHandler));
      }));
        // } TODO - no If yet.
        // return EMPTY;
      /*
      finalize(() => {
            this.hideLoader();
        })
       */
  }

  errorHandler(error) {
    let errorMessage = '';
    // this.log('bond data failed to load');
    if (error.error instanceof ErrorEvent) {
      // Get client-side error
      errorMessage = error.error.message;
    } else {
      // Get server-side error
      errorMessage = `error on refreshing token Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(errorMessage);
  }

  /*protected retryWithKeyRefresh(err: Observable<any>, request: HttpRequest<any>):Observable<any> {
    if (err.status === 401 || err.status == 403) {
      // auto logout if 401 response returned from api
      this.authenticationService.refreshToken().subscribe(() => {
          console.log("Ran authentication service applying new token. Retrying request status: " + err.status + " request " + request.url);
          request = this.authenticationService.addAuthHeader(request);
          // retryWhen
          return next.handle(request).pipe(retry(1));
        },
        catchError(e => {
          console.log("Found a second error in the error interceptor. " + e.error.message);
          if (e.status !== 401) {
            return this.authenticationService.handleResponseError(e);
          } else {

            this.authenticationService.logout();
          }
        }));
    }
    return throwError(err);
  }*/

}


// private shouldRetry = (error) => error.status === 502;

/* .pipe(
 switchMap(() => {
   console.log("Ran authentication service applying new token");
   request = this.authenticationService.addAuthHeader(request);
   return next.handle(request);
 })*/

