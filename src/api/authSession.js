let accessToken = null;
let refreshToken = null;

export function getAccessToken() {
	return accessToken;
}

export function getRefreshToken() {
	return refreshToken;
}

export function setAuthTokens(nextAccessToken, nextRefreshToken) {
	accessToken = nextAccessToken || null;
	refreshToken = nextRefreshToken || null;
}

export function clearAuthTokens() {
	accessToken = null;
	refreshToken = null;
}
