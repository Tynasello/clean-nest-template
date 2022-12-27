import {
  Body,
  Controller,
  Inject,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthUseCase } from 'src/application/use-cases/auth-use-case';
import { User } from 'src/domain/entities/user';
import { SignupUserRequestDto } from 'src/infrastructure/rest/dto/auth/signup-user-request.dto';
import { SignupUserResponseDto } from 'src/infrastructure/rest/dto/auth/signup-user-response.dto';
import { SetCookiesInterceptor } from 'src/infrastructure/rest/interceptors/set-cookies.interceptor';
import { UseCaseProxy } from 'src/infrastructure/use-cases-proxy/use-cases-proxy';
import { UseCaseProxyModule } from 'src/infrastructure/use-cases-proxy/use-cases-proxy.module';
import { GetUserFromReq } from '../decorators/get-user-from-req.decorator';
import { LoginUserRequestDto } from '../dto/auth/login-user-request.dto';
import { LoginUserResponseDto } from '../dto/auth/login-user.response.dto';
import { AccessTokenGuard } from '../guards/access-token.guard';
import { BaseController } from './base-controller';

@Controller('auth')
export class AuthController extends BaseController {
  constructor(
    @Inject(UseCaseProxyModule.SIGNUP_USE_CASE_PROXY)
    private readonly _authUseCaseProxy: UseCaseProxy<AuthUseCase>,
  ) {
    super();
  }

  @Post('signup-user')
  @UseInterceptors(SetCookiesInterceptor)
  public async signupUser(
    @Body() signupUserDto: SignupUserRequestDto,
  ): Promise<SignupUserResponseDto> {
    const user = new User({
      username: signupUserDto.username,
      password: signupUserDto.password,
    });
    const createdAuthTokensOrError = await this._authUseCaseProxy
      .getInstance()
      .signupUser(user);
    if (createdAuthTokensOrError.isFailure) {
      this.handleFailedResult(createdAuthTokensOrError.getError());
    }
    const createdAuthTokens = createdAuthTokensOrError.getValue();
    const signupUserResponseDto = new SignupUserResponseDto(createdAuthTokens);
    return signupUserResponseDto;
  }

  @Post('login-user')
  @UseInterceptors(SetCookiesInterceptor)
  public async loginUser(
    @Body() loginUserDto: LoginUserRequestDto,
  ): Promise<LoginUserResponseDto> {
    const user = new User({
      username: loginUserDto.username,
      password: loginUserDto.password,
    });
    const createdAuthTokensOrError = await this._authUseCaseProxy
      .getInstance()
      .loginUser(user);
    if (createdAuthTokensOrError.isFailure) {
      this.handleFailedResult(createdAuthTokensOrError.getError());
    }
    const createdAuthTokens = createdAuthTokensOrError.getValue();
    const loginUserResponseDto = new LoginUserResponseDto(createdAuthTokens);
    return loginUserResponseDto;
  }

  @Post('logout-user')
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(SetCookiesInterceptor)
  public async logoutUser(
    @GetUserFromReq('username') username: string,
  ): Promise<void> {
    const userLoggedOutOrError = await this._authUseCaseProxy
      .getInstance()
      .logoutUser(username);
    if (userLoggedOutOrError.isFailure) {
      this.handleFailedResult(userLoggedOutOrError.getError());
    }
  }
}
