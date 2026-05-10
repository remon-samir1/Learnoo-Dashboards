import getUserDataFromJWT from "@/lib/server.utils"

export const getStudentData = async ()=> {
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

export const getStudentProgression = async ()=>{
     const userData =await getUserDataFromJWT();
   
    const token = userData?.token
  
    try {
        const res = await fetch(`https://api.learnoo.app/v1/user-progress`, {
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
export const getStudentCourses = async ()=>{
     const userData =await getUserDataFromJWT();
   
    const token = userData?.token
  
    try {
        const res = await fetch(`https://api.learnoo.app/v1/course`, {
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
export const getStudentLiveSessions = async ()=>{
     const userData =await getUserDataFromJWT();
   
    const token = userData?.token
  
    try {
        const res = await fetch(`https://api.learnoo.app/v1/live-room`, {
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

