import { CacheService } from '@interface-adapters/Cache.service';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of, tap } from 'rxjs';

@Injectable()
export class CachingInterceptor implements NestInterceptor {
  constructor(private readonly cacheService: CacheService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    if (context.getType() === 'http') {
      const http = context.switchToHttp();
      const request = http.getRequest();

      const method = request.method;
      const url = request.url;

      if (method !== 'GET') {
        this.cacheService.reset();
        // console.log('Resetting cache (from CachingInterceptor)');
        return next.handle();
      }

      const cacheKey = JSON.stringify(url);

      const cachedData = await this.cacheService.get(cacheKey);
      if (cachedData) {
        // console.log(`Getting ${cacheKey} in cache (from CachingInterceptor)`);
        return of(cachedData);
      }

      return next.handle().pipe(
        tap(async (data) => {
          if (data instanceof Error) return;
          // console.log(`Caching ${cacheKey} (from CachingInterceptor)`);
          await this.cacheService.set(cacheKey, data);
        }),
      );
    }

    return next.handle();
  }
}
