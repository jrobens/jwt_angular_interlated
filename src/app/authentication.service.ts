import {Injectable} from '@angular/core';
import {
  HttpHeaders,
  HttpRequest,
  HttpHandler,
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';
import {BehaviorSubject, Observable, throwError, Subject, Subscription} from 'rxjs';
import {catchError, switchMap, take, tap} from 'rxjs/operators';

import {environment} from '../environments/environment';
import {User} from './model/user';

@Injectable({providedIn: 'root'})
export class AuthenticationService {
  // Subscribe to retrieve the current stored token. No HTTP request.
  private currentUserSubject: BehaviorSubject<User>;
  public currentUser: Observable<User>;

  // Subscribe to token updates
  tokenRefreshedSource = new Subject();
  tokenRefreshed$ = this.tokenRefreshedSource.asObservable();

  private subscribedObservable$: Subscription = new Subscription();
  tokenSubject: Subject<boolean> = new Subject<boolean>();

  private host = environment.data_host;
  refreshTokenInProgress = false;

  httpOptionsBasic = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa('api' + ':' + findToken()),
    }),
    withCredentials: true,
  };

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('currentUser')));
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }

  login(): Observable<any> {
    return this.http.get<any>(`${this.host}/jwt/token`, this.httpOptionsBasic).pipe(tap(user => {
      // store user details and jwt token in local storage to keep user logged in between page refreshes
      localStorage.setItem('currentUser', JSON.stringify(user));

      // See if local storage is not being refreshed.
      this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('currentUser')));

      // https://blog.angular-university.io/angular-jwt-authentication/
      // const expiresAt = moment().add(authResult.expiresIn,'second');
      // localStorage.setItem("expires_at", JSON.stringify(expiresAt.valueOf()) );
      this.tokenRefreshedSource.next();
      this.refreshTokenInProgress = false;
      // this.currentUserSubject.next(user);
    })).pipe(
      catchError(this.errorHandler));
  }

  addAuthHeader(request) {
    const user: User = this.currentUserSubject.value;
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${user.token}`
      }
    });

    return request;
  }

  // https://stackoverflow.com/questions/45202208/angular-4-interceptor-retry-requests-after-token-refresh
  /*
   * Coming straight from the error interceptor.
   */
  refreshToken(): Observable<any> {
    if (this.refreshTokenInProgress) {
      console.log('Token refresh in progress.');
      return new Observable(observer => {
        this.subscribedObservable$.add(
          this.tokenRefreshed$.subscribe(() => {
            observer.next();
            observer.complete();
          })
        );
      });
    } else {
      this.refreshTokenInProgress = true;
      console.log('Refreshing token.');

      // getNewAccessTokenByRefreshToken()
      return this.login().pipe(tap(newAuthToken => {
          this.tokenRefreshedSource.next(this.currentUserSubject);
      }));
    }
  }

  // Token error handler
  errorHandler(error) {
    this.refreshTokenInProgress = false;
    this.logout();
    return throwError(error);
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<any> {
    console.log('handling a 401 error');
    this.requestRefreshToken();
    return this.tokenSubject.pipe(
      take(1),
      switchMap(token => {
        return next.handle(request);
      }));
  }

  logout() {
    // remove user from local storage to log user out
    console.log('logout()');
  //  localStorage.removeItem('currentUser');
  //  this.currentUserSubject.next(null);
  }

  private requestRefreshToken() {
    if (!this.refreshTokenInProgress) {
      this.refreshTokenInProgress = true;
      this.refreshToken()
        .subscribe(user => {
          if (user) {
            this.tokenSubject.next(user);
          }
          this.refreshTokenInProgress = false;
        }, (err: HttpErrorResponse) => {
          this.logout();
          this.refreshTokenInProgress = false;
          throw throwError(err);
        }, () => {
        });
    }
  }
}
