import { createAuthClient  } from "better-auth/react"

console.log(process.env.BACKEND_URL)
export const authClient =  createAuthClient({
    baseURL: "http://localhost:5000", // the base url of your auth server 
})