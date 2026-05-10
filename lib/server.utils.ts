"use server";

import { cookies } from "next/headers";

const getUserDataFromJWT = async () => {
  
    const cookieStore = await cookies();

    const token = cookieStore.get("token")?.value;

    if (!token) return null;

    const cleanToken = token.replace("Bearer ", "");

    const decodedToken = JSON.parse(atob(cleanToken.split(".")[1]));

    return {
      token: cleanToken,
      data: decodedToken,
    };
  
};

export default getUserDataFromJWT;