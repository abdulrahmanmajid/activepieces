import { AppSystemProp } from '@activepieces/server-shared'
import { ActivepiecesError, ApEdition, ApEnvironment, AuthenticationResponse, ErrorCode, isNil, Principal, PrincipalType, Project, TelemetryEventName, User, UserIdentity, UserIdentityProvider, UserStatus, PlatformRole, SignUpRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../helper/system/system'
import { telemetry } from '../helper/telemetry.utils'
import { platformService } from '../platform/platform.service'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'
import { userInvitationsService } from '../user-invitations/user-invitation.service'
import { accessTokenManager } from './lib/access-token-manager'
import { userIdentityService } from './user-identity/user-identity-service'

export const authenticationUtils = {
    async assertUserIsInvitedToPlatformOrProject(log: FastifyBaseLogger, {
        email,
        platformId,
    }: AssertUserIsInvitedToPlatformOrProjectParams): Promise<void> {
        if (system.getEdition() === ApEdition.COMMUNITY) {
            return
        }

        const isInvited = await userInvitationsService(log).hasAnyAcceptedInvitations({
            platformId,
            email,
        })

        if (!isInvited) {
            throw new ActivepiecesError({
                code: ErrorCode.INVITATION_ONLY_SIGN_UP,
                params: {
                    message: 'Sign up is restricted. You need an invitation to join.',
                },
            })
        }
    },

    async getProjectAndToken(params: GetProjectAndTokenParams): Promise<AuthenticationResponse> {
        const user = await userService.getOneOrFail({ id: params.userId })
        const projects = await projectService.getAllForUser({
            platformId: params.platformId,
            userId: params.userId,
        })
        const project = isNil(params.projectId) ? projects?.[0] : projects.find((project) => project.id === params.projectId)
        if (isNil(project)) {
            throw new ActivepiecesError({
                code: ErrorCode.INVITATION_ONLY_SIGN_UP,
                params: {
                    message: 'No project found for user',
                },
            })
        }
        const identity = await userIdentityService(system.globalLogger()).getOneOrFail({ id: user.identityId })
        if (!identity.verified) {
            throw new ActivepiecesError({
                code: ErrorCode.EMAIL_IS_NOT_VERIFIED,
                params: {
                    email: identity.email,
                },
            })
        }
        if (user.status === UserStatus.INACTIVE) {
            throw new ActivepiecesError({
                code: ErrorCode.USER_IS_INACTIVE,
                params: {
                    email: identity.email,
                },
            })
        }
        const token = await accessTokenManager.generateToken({
            id: user.id,
            type: PrincipalType.USER,
            projectId: project.id,
            platform: {
                id: params.platformId,
            },
            tokenVersion: identity.tokenVersion,
        })
        return {
            ...user,
            firstName: identity.firstName,
            lastName: identity.lastName,
            email: identity.email,
            trackEvents: identity.trackEvents,
            newsLetter: identity.newsLetter,
            verified: identity.verified,
            token,
            projectId: project.id,
        }
    },

    async assertDomainIsAllowed({
        email,
        platformId,
    }: AssertDomainIsAllowedParams): Promise<void> {
        const edition = system.getEdition()
        if (edition === ApEdition.COMMUNITY) {
            return
        }
        const platform = await platformService.getOneOrThrow(platformId)
        if (!platform.ssoEnabled) {
            return
        }
        const emailDomain = email.split('@')[1]
        const isAllowedDomaiin =
            !platform.enforceAllowedAuthDomains ||
            platform.allowedAuthDomains.includes(emailDomain)

        if (!isAllowedDomaiin) {
            throw new ActivepiecesError({
                code: ErrorCode.DOMAIN_NOT_ALLOWED,
                params: {
                    domain: emailDomain,
                },
            })
        }
    },

    async assertEmailAuthIsEnabled({
        platformId,
        provider,
    }: AssertEmailAuthIsEnabledParams): Promise<void> {
        const edition = system.getEdition()
        if (edition === ApEdition.COMMUNITY) {
            return
        }
        const platform = await platformService.getOneOrThrow(platformId)
        if (!platform.ssoEnabled) {
            return
        }
        if (provider !== UserIdentityProvider.EMAIL) {
            return
        }
        if (!platform.emailAuthEnabled) {
            throw new ActivepiecesError({
                code: ErrorCode.EMAIL_AUTH_DISABLED,
                params: {},
            })
        }
    },

    async sendTelemetry({
        user,
        identity,
        project,
        log,
    }: SendTelemetryParams): Promise<void> {
        try {
            await telemetry(log).identify(user, identity, project.id)

            await telemetry(log).trackProject(project.id, {
                name: TelemetryEventName.SIGNED_UP,
                payload: {
                    userId: identity.id,
                    email: identity.email,
                    firstName: identity.firstName,
                    lastName: identity.lastName,
                    projectId: project.id,
                },
            })
        }
        catch (e) {
            log.warn({ name: 'AuthenticationService#sendTelemetry', error: e })
        }
    },

    async saveNewsLetterSubscriber(user: User, platformId: string, identity: UserIdentity, log: FastifyBaseLogger): Promise<void> {
        const platform = await platformService.getOneOrThrow(platformId)
        const environment = system.get(AppSystemProp.ENVIRONMENT)
        if (environment !== ApEnvironment.PRODUCTION) {
            return
        }
        if (platform.embeddingEnabled) {
            return
        }
        try {
            const response = await fetch(
                'https://us-central1-activepieces-b3803.cloudfunctions.net/addContact',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: identity.email }),
                },
            )
            return await response.json()
        }
        catch (error) {
            log.warn(error)
        }
    },
    async extractUserIdFromPrincipal(
        principal: Principal,
    ): Promise<string> {
        if (principal.type === PrincipalType.USER) {
            return principal.id
        }
        // TODO currently it's same as api service, but it's better to get it from api key service, in case we introduced more admin users
        const project = await projectService.getOneOrThrow(principal.projectId)
        return project.ownerId
    },

    async generateAuthTokens(userIdentity: UserIdentity, platformId: string, projectId: string): Promise<AuthenticationResponse> {
        const token = await accessTokenManager.generateToken({
            id: userIdentity.id,
            type: PrincipalType.USER,
            platform: {
                id: platformId,
            },
            projectId: projectId,
            tokenVersion: userIdentity.tokenVersion,
        })

        return {
            id: userIdentity.id,
            email: userIdentity.email,
            firstName: userIdentity.firstName,
            lastName: userIdentity.lastName,
            trackEvents: userIdentity.trackEvents,
            newsLetter: userIdentity.newsLetter,
            verified: userIdentity.verified,
            platformId: platformId,
            platformRole: PlatformRole.ADMIN,
            token,
            projectId: projectId,
            status: UserStatus.ACTIVE,
        }
    }
}

type SendTelemetryParams = {
    identity: UserIdentity
    user: User
    project: Project
    log: FastifyBaseLogger
}

type AssertDomainIsAllowedParams = {
    email: string
    platformId: string
}

type AssertEmailAuthIsEnabledParams = {
    platformId: string
    provider: UserIdentityProvider
}

type AssertUserIsInvitedToPlatformOrProjectParams = {
    email: string
    platformId: string
}

type GetProjectAndTokenParams = {
    userId: string
    platformId: string
    projectId: string | null
}

export const authenticationService = {
    async signUp(request: SignUpRequest): Promise<AuthenticationResponse> {
        const userIdentity = await userIdentityService(system.globalLogger()).create({
            email: request.email,
            password: request.password,
            firstName: request.firstName,
            lastName: request.lastName,
            trackEvents: request.trackEvents,
            newsLetter: request.newsLetter,
            provider: UserIdentityProvider.EMAIL,
        })

        if (system.getEdition() === ApEdition.COMMUNITY) {
            await userIdentityService(system.globalLogger()).verify(userIdentity.id)
            
            const platform = await platformService.create({
                ownerId: userIdentity.id,
                name: `${request.firstName}'s Workspace`,
            })

            const user = await userService.create({
                identityId: userIdentity.id,
                platformRole: PlatformRole.ADMIN,
                platformId: platform.id,
            })

            const project = await projectService.create({
                displayName: `My First Project`,
                ownerId: user.id,
                platformId: platform.id,
            })

            return authenticationUtils.generateAuthTokens(userIdentity, platform.id, project.id)
        }

        return authenticationUtils.generateAuthTokens(userIdentity, '', '')
    }
}