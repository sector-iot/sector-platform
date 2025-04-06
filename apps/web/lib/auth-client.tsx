import { createAuthClient  } from "better-auth/react"
import { apiKeyClient } from "better-auth/client/plugins"

console.log(process.env.NEXT_PUBLIC_API_URL)
export const authClient =  createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL, // the base url of your auth server 
    plugins: [ 
        apiKeyClient() 
    ]
})