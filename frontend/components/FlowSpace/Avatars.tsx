//import { useSession } from "next-auth/react";
//import { useRouter } from "next/router";


interface User {
    email: string;
    name: string;
    image: string;
}

interface AvatarsProps {
    users?: User[];
}
export default function Avatars({users = []}: AvatarsProps) {
    return (
        <div className="flex space-x-2 p-4">
        {users.map((user: any) => (
            <img
            key={user.email}
            src={user.image}
            className="w-10 h-10 rounded-full border-2 border-white"
            title={user.name}
            />
        ))}
        </div>
    );
}
            