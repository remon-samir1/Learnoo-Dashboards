import getUserDataFromJWT from "@/lib/server.utils";

export const getLibrary = async () => {
  const userData = await getUserDataFromJWT();

  const token = userData?.token;

  try {
    const res = await fetch(`https://api.learnoo.app/v1/library`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch notes",
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message,
    };
  }
};