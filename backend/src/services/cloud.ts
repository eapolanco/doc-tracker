import { google } from "googleapis";
import * as msal from "@azure/msal-node";
import dotenv from "dotenv";
import { db } from "@/db/index.js";
import { cloudAccounts } from "@/db/schema.js";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "placeholder";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "placeholder";
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  "http://localhost:3001/api/auth/google/callback";

const ONEDRIVE_CLIENT_ID = process.env.ONEDRIVE_CLIENT_ID || "placeholder";
const ONEDRIVE_CLIENT_SECRET =
  process.env.ONEDRIVE_CLIENT_SECRET || "placeholder";
const ONEDRIVE_REDIRECT_URI =
  process.env.ONEDRIVE_REDIRECT_URI ||
  "http://localhost:3001/api/auth/onedrive/callback";

export const googleClient = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
);

export const msalClient = new msal.ConfidentialClientApplication({
  auth: {
    clientId: ONEDRIVE_CLIENT_ID,
    clientSecret: ONEDRIVE_CLIENT_SECRET,
    authority: "https://login.microsoftonline.com/common",
  },
});

export const getGoogleAuthUrl = () => {
  return googleClient.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
};

export const getOneDriveAuthUrl = async () => {
  return await msalClient.getAuthCodeUrl({
    scopes: ["Files.Read.All", "User.Read"],
    redirectUri: ONEDRIVE_REDIRECT_URI,
  });
};

export const handleGoogleCallback = async (code: string) => {
  const { tokens } = await googleClient.getToken(code);
  googleClient.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: googleClient });
  const { data: userInfo } = await oauth2.userinfo.get();

  const id = uuidv4();
  await db.insert(cloudAccounts).values({
    id,
    provider: "google",
    email: userInfo.email!,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  });

  return userInfo;
};

export const handleOneDriveCallback = async (code: string) => {
  const result = await msalClient.acquireTokenByCode({
    code,
    scopes: ["Files.Read.All", "User.Read"],
    redirectUri: ONEDRIVE_REDIRECT_URI,
  });

  const id = uuidv4();
  await db.insert(cloudAccounts).values({
    id,
    provider: "onedrive",
    email: result.account?.username || "unknown",
    accessToken: result.accessToken,
    // MSAL handles refresh tokens internally or via token cache,
    // for simplicity we store what we get
    refreshToken: (result as any).refreshToken || null,
    expiresAt: result.expiresOn,
  });

  return result.account;
};
