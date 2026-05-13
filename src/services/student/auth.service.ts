import getUserDataFromJWT from "@/lib/server.utils";

export const userLogout = async () => {
  const userData = await getUserDataFromJWT();
  const token = userData?.token;

  try {
    const res = await fetch("https://api.learnoo.app/v1/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (res.status === 204) {
      return {
        success: true,
        message: "Logged out successfully",
        data: null,
      };
    }

    let data: { message?: string } | null = null;

    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (res.status === 401) {
      return {
        success: true,
        message: data?.message || "Session expired, logged out",
        data: null,
      };
    }

    if (!res.ok) {
      return {
        success: false,
        message: data?.message || "Logout failed",
      };
    }

    return {
      success: true,
      message: data?.message || "Logged out successfully",
      data: null,
    };
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message,
    };
  }
};