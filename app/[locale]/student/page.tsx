import { getUserData } from "@/src/services/student/user.service";


export default async function  StudentPage () {
 const {data:{data:{attributes}}} =await getUserData();

  return <div>

  </div>;
}