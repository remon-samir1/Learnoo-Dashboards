import WelcomeSection from "@/src/components/student/home/WelcomeSection";
import { getStudentCourses, getStudentData, getStudentLiveSessions, getStudentProgression } from "@/src/services/student/user.service";


export default async function  StudentPage () {
 const {data:{data:{attributes:student}}} =await getStudentData();
const {data:{data: progress}}= await  getStudentProgression();
const {data:{data:courses}}= await getStudentCourses();
const {data:{data:liveSessions}}= await getStudentLiveSessions();



  return <div >
<WelcomeSection courses={courses} progress={progress} student={student} liveSessions={liveSessions} />
  </div>;
}