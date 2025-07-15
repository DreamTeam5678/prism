import { google } from "googleapis";

export function getGoogleOAuthClient(accessToken: string) {
    const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID!,
        process.env.GOOGLE_CLIENT_SECRET!,
    )
;
    oAuth2Client.setCredentials({
        access_token: accessToken,
    });
    return google.calendar({
        version: "v3",
        auth: oAuth2Client,
    });
}