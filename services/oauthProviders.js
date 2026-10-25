const axios = require('axios');
const crypto = require('crypto');

/**
 * Per-platform OAuth details.
 *
 * Scopes are deliberately minimal — a bot should be able to read and post
 * messages, nothing more. The previous Discord request asked for
 * `permissions=8` (Administrator), which grants full control of the server:
 * delete channels, kick members, edit roles. That is a serious over-reach for
 * something whose entire job is answering questions.
 */

// Bitfield values are the permission bits themselves, summed.
//   ViewChannel (1024) + SendMessages (2048) + ReadMessageHistory (65536)
const DISCORD_MINIMAL_PERMISSIONS = 1024 + 2048 + 65536; // 68608

const PLATFORMS = {
    discord: {
        label: 'Discord',
        // "bot applications only" — never ask for the user's identity.
        integrationType: 0,
        scopes: 'bot applications.commands',
        // OAuth2 PKCE (RFC 7636) for public clients.
        usePKCE: true,
        authorizeUrl: 'https://discord.com/oauth2/authorize',
        tokenUrl: 'https://discord.com/api/oauth2/token',
        defaultPermissions: DISCORD_MINIMAL_PERMISSIONS,
    },
    slack: {
        label: 'Slack',
        scopes: 'chat:write,chat:write.public,channels:history,channels:read',
        authorizeUrl: 'https://slack.com/oauth/v2/authorize',
        tokenUrl: 'https://slack.com/api/oauth.v2.access',
        usePKCE: false,
    },
};

/**
 * Build the provider authorization URL.
 * @param {string} platform
 * @param {object} opts
 * @param {string} opts.clientId
 * @param {string} opts.redirectUri
 * @param {string} opts.state       signed state token
 * @param {string} [opts.codeChallenge] S256 PKCE challenge
 */
function buildAuthorizeUrl(platform, { clientId, redirectUri, state, codeChallenge }) {
    const cfg = PLATFORMS[platform];
    if (!cfg) throw new Error(`Unsupported OAuth platform: ${platform}`);

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        state,
        // Slack v2 uses `user_scope` (empty for bot-only) and `bot_scopes`.
        // Discord wants `scope=bot` + `bot_permissions`.
        scope: platform === 'slack' ? 'bot' : cfg.scopes,
    });

    if (platform === 'slack') {
        params.set('bot_scopes', cfg.scopes);
        params.delete('scope');
        params.set('user_scope', '');
    }

    if (platform === 'discord') {
        params.set('response_type', 'code');
        params.set('integration_type', String(cfg.integrationType));
        params.set('permissions', String(cfg.defaultPermissions));
        if (codeChallenge) {
            params.set('code_challenge', codeChallenge);
            params.set('code_challenge_method', 'S256');
        }
    }

    return `${cfg.authorizeUrl}?${params.toString()}`;
}

/** S256 PKCE challenge from a verifier. */
function pkceChallenge(verifier) {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
}

function pkceVerifier() {
    return crypto.randomBytes(32).toString('base64url');
}

/**
 * Exchange an authorization code for tokens.
 * @returns {Promise<object>} normalised credentials
 */
async function exchangeCode(platform, { clientId, clientSecret, code, redirectUri, codeVerifier }) {
    const cfg = PLATFORMS[platform];
    if (!cfg) throw new Error(`Unsupported OAuth platform: ${platform}`);

    if (platform === 'slack') {
        const res = await axios.post(cfg.tokenUrl, null, {
            params: { client_id: clientId, client_secret: clientSecret, code },
        });
        if (!res.data.ok) throw new Error(`Slack refused the code: ${res.data.error}`);

        // Also resolve the workspace name so the dashboard can show "Acme Corp".
        let teamName = null;
        try {
            const auth = await axios.post('https://slack.com/api/auth.test', {}, {
                headers: { Authorization: `Bearer ${res.data.access_token}` },
            });
            teamName = auth.data.team || null;
        } catch {
            // Non-fatal: we can still connect without a display name.
        }

        return {
            token: res.data.access_token,
            teamId: res.data.team?.id || null,
            teamName,
            botUserId: res.data.bot_user_id || null,
            appId: res.data.app_id || null,
        };
    }

    // Discord
    const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
    });
    if (codeVerifier) params.append('code_verifier', codeVerifier);

    const res = await axios.post(cfg.tokenUrl, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const guild = res.data.guild || {};
    return {
        token: res.data.access_token,
        guildId: guild.id || null,
        guildName: guild.name || null,
    };
}

module.exports = {
    PLATFORMS,
    buildAuthorizeUrl,
    exchangeCode,
    pkceChallenge,
    pkceVerifier,
    DISCORD_MINIMAL_PERMISSIONS,
};