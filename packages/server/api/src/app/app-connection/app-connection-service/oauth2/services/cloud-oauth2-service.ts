import { OAuth2AuthorizationMethod } from '@openops/blocks-framework';
import { logger, SharedSystemProp, system } from '@openops/server-shared';
import {
  AppConnectionType,
  ApplicationError,
  CloudOAuth2ConnectionValue,
  ErrorCode,
} from '@openops/shared';
import axios from 'axios';
import {
  ClaimOAuth2Request,
  OAuth2Service,
  RefreshOAuth2Request,
} from '../oauth2-service';

export const cloudOAuth2Service: OAuth2Service<CloudOAuth2ConnectionValue> = {
  refresh,
  claim,
};

async function refresh({
  blockName,
  connectionValue,
}: RefreshOAuth2Request<CloudOAuth2ConnectionValue>): Promise<CloudOAuth2ConnectionValue> {
  const requestBody = {
    refreshToken: connectionValue.refresh_token,
    blockName,
    clientId: connectionValue.client_id,
    edition: system.getEdition(),
    authorizationMethod: connectionValue.authorization_method,
    tokenUrl: connectionValue.token_url,
  };

  logger.info(`Refreshing token via Lambda for block: ${blockName}`);

  try {
    const oauthProxyUrl = system.get<string>(
      SharedSystemProp.INTERNAL_OAUTH_PROXY_URL,
    );

    const response = (
      await axios.post(`${oauthProxyUrl}/refresh`, requestBody, {
        timeout: 10000,
      })
    ).data;

    return {
      ...connectionValue,
      ...response,
      props: connectionValue.props,
      type: AppConnectionType.CLOUD_OAUTH2,
    };
  } catch (e: unknown) {
    logger.error('Error refreshing token via Lambda', e);
    throw new ApplicationError({
      code: ErrorCode.INVALID_CLOUD_REFRESH,
      params: { blockName },
    });
  }
}

async function claim({
  request,
  blockName,
}: ClaimOAuth2Request): Promise<CloudOAuth2ConnectionValue> {
  try {
    const cloudRequest: ClaimWithCloudRequest = {
      code: request.code,
      codeVerifier: request.codeVerifier,
      authorizationMethod: request.authorizationMethod,
      clientId: request.clientId,
      tokenUrl: request.tokenUrl,
      blockName,
      edition: system.getEdition(),
    };

    const oauthProxyUrl = system.get<string>(
      SharedSystemProp.INTERNAL_OAUTH_PROXY_URL,
    );

    const value = (
      await axios.post<CloudOAuth2ConnectionValue>(
        `${oauthProxyUrl}/claim`,
        cloudRequest,
        {
          timeout: 10000,
        },
      )
    ).data;
    return {
      ...value,
      token_url: request.tokenUrl,
      props: request.props,
    };
  } catch (e: unknown) {
    logger.error(e);
    throw new ApplicationError({
      code: ErrorCode.INVALID_CLOUD_CLAIM,
      params: {
        blockName,
      },
    });
  }
}

type ClaimWithCloudRequest = {
  blockName: string;
  code: string;
  codeVerifier: string | undefined;
  authorizationMethod: OAuth2AuthorizationMethod | undefined;
  edition: string;
  clientId: string;
  tokenUrl: string;
};
