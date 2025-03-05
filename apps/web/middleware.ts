import { betterFetch } from "@better-fetch/fetch";

import { NextRequest, NextResponse } from "next/server";
 
export async function middleware(request: NextRequest) {
	const { data: session } = await betterFetch("/api/auth/get-session", {
		baseURL: process.env.BACKEND_URL,
		headers: {
			cookie: request.headers.get("cookie") || "", // Forward the cookies from the request
		},
	});
 
	if (!session) {
		return NextResponse.redirect(new URL("/auth/login", request.url));
	}
	return NextResponse.next();
}
 
export const config = {
	matcher: ["/dashboard"], // Apply middleware to specific routes
};