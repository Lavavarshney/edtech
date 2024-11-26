const { validateToken } = require('../services/authentication');

function checkForAuthenticationCookie(cookieName) {
    return async (req, res, next) => {
        console.log("Requested cookie name:", cookieName);
        console.log("All cookies:", req.cookies);
        const tokenCookieValue = await req.cookies[cookieName];
        console.log("tokenCookieValue:", tokenCookieValue);

        if (!tokenCookieValue) {
            return next();
        }
        
        try {
            console.log("inside try block");
            const userPayload = validateToken(tokenCookieValue);
            console.log("userPayload:", userPayload);
            req.user = userPayload;
        } catch (error) {
            console.error("Error validating token:", error);
        }

        next();
    };
}

module.exports = { checkForAuthenticationCookie };
