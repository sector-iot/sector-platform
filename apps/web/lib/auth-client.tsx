import { createAuthClient  } from "better-auth/react"
import { apiKeyClient } from "better-auth/client/plugins"

if (!process.env.NEXT_PUBLIC_API_URL) {
  console.log('Warning: NEXT_PUBLIC_API_URL environment variable is not set')
}

export const authClient =  createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL, // the base url of your auth server 
    plugins: [ 
        apiKeyClient() 
    ]
})