import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@repo/database";
import { apiKey } from "better-auth/plugins";
import dotenv from "dotenv"

dotenv.config()

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true
    },
    trustedOrigins: [process.env.FRONTEND_URL as string],
    plugins: [
        apiKey()
    ],
    advanced: {
        crossSubDomainCookies: {
            enabled: true,
            domain: ".sector-iot.space", // Domain with a leading period
        },
    }
})