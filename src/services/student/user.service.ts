//src/services/student/user.service.ts
import getUserDataFromJWT from "@/lib/server.utils";
import { appendStudentAcademicFormFields } from "@/src/lib/student-academic-update";
import { UpdateProfileFormValues } from "@/src/schemas/profile.schema";

export const getStudentData = async () => {
  const userData = await getUserDataFromJWT();

  const token = userData?.token;

  try {
    const res = await fetch(`https://api.learnoo.app/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok)
      return {
        success: false,
        message: data.message,
      };
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

export const getStudentProgression = async () => {
  const userData = await getUserDataFromJWT();

  const token = userData?.token;

  try {
    const res = await fetch(`https://api.learnoo.app/v1/user-progress`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok)
      return {
        success: false,
        message: data.message,
      };
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
export const getStudentCourses = async (categoryId?: number | string) => {
  const userData = await getUserDataFromJWT();

  const token = userData?.token;

  try {
    const params = new URLSearchParams();
    params.set("activated", "1");
    if (categoryId != null && String(categoryId).trim() !== "") {
      params.set("category_id", String(categoryId));
    }
    const res = await fetch(`https://api.learnoo.app/v1/course?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok)
      return {
        success: false,
        message: data.message,
      };
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
export const getStudentNotes = async () => {
  const userData = await getUserDataFromJWT();

  const token = userData?.token;

  try {
    const res = await fetch(`https://api.learnoo.app/v1/note`, {
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
export const getUserProfileData = async () => {
  const userData = await getUserDataFromJWT();

  const token = userData?.token;

  try {
    const res = await fetch(`https://api.learnoo.app/v1/auth/me`, {
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

export const updateUserProfile = async (data: UpdateProfileFormValues) => {
  const userData = await getUserDataFromJWT();
  const token = userData?.token;

  const formData = new FormData();

  if (data.first_name) formData.append("first_name", data.first_name);
  if (data.last_name) formData.append("last_name", data.last_name);
  if (data.phone) formData.append("phone", String(data.phone));
  if (data.email) formData.append("email", data.email);
  if (data.image instanceof File) formData.append("image", data.image);
  if (data.university_id && data.center_id && data.faculty_id) {
    appendStudentAcademicFormFields(formData, {
      universityId: data.university_id,
      centerId: data.center_id,
      facultyId: data.faculty_id,
      departmentId: data.department_id || undefined,
    });
  }

  try {
    const res = await fetch("https://api.learnoo.app/v1/auth/update", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: formData,
    });

    const payload = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: payload?.message || "Failed to update profile",
      };
    }

    return {
      success: true,
      data: payload,
      message: payload?.message || "Profile updated successfully",
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Request failed",
    };
  }
};

export const getStudentNotifications = async () => {
  const userData = await getUserDataFromJWT();
  const token = userData?.token;

  try {
    const res = await fetch(`https://api.learnoo.app/v1/notifications`, {
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
        message: data?.message || "Failed to fetch notifications",
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

export const updateUserPassword = async (password: string) => {
  const userData = await getUserDataFromJWT();
  const token = userData?.token;

 


  try {
    const res = await fetch("https://api.learnoo.app/v1/auth/update", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({password}),
    });

    const payload = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: payload?.message,
      };
    }

    return {
      success: true,
      data: payload,
      message: payload?.message,
    };
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message,
    };
  }
};
