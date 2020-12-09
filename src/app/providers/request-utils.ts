import {Observable, throwError, timer} from "rxjs";
import {finalize, mergeMap} from "rxjs/operators";
import {HttpRequest} from "@angular/common/http";

export const genericRetryStrategy = ({
                                       maxRetryAttempts = 1,
                                       scalingDuration = 1000,
                                       includedStatusCodes = [],
                                       request,
                                     }: {
  maxRetryAttempts?: number,
  scalingDuration?: number,
  includedStatusCodes?: number[],
  request?: HttpRequest<any>,
} = {}) => (attempts: Observable<any>) => {
  return attempts.pipe(
    mergeMap((error, i) => {
      error.status
      const retryAttempt = i + 1;

      // Refresh the token
      if (includedStatusCodes.find(e => e === error.status)) {
        this.authenticationService.refreshToken().subscribe(() => {
          console.log("Ran authentication service applying new token. Retrying request status: " + error.status + " request " + request.url);
          return this.authenticationService.addAuthHeader(request);
        });
      }

      // if maximum number of retries have been met
      // or response is a status code we don't wish to retry, throw error
      if (
        retryAttempt > 1 ||
        !includedStatusCodes.find(e => e === error.status)
      ) {
        return throwError(error);
      }
      console.log(
        `Attempt ${retryAttempt}: retrying in ${retryAttempt *
        scalingDuration}ms`
      );
      // retry after 1s, 2s, etc...
      return timer(retryAttempt * scalingDuration);
    }),
    finalize(() => console.log('We are done!'))
  );
};
