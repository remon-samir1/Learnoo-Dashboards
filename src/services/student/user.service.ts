import getUserDataFromJWT from "@/lib/server.utils"

export const getUserData = async ()=> {
    const userData =await getUserDataFromJWT();
   
    const token = userData?.token
  
    try {
        const res = await fetch(`https://api.learnoo.app/v1/auth/me`, {
    headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    }
})

const data = await res.json();

if (!res.ok) return {
    success: false,
    message: data.message
}
return {
    success: true,
    data
}
    } catch (error) {
        return {
            success: false,
            message: (error as Error).message
        }
    }
}