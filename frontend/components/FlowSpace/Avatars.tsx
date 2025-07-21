export default function Avatars({users}) {
    return (
        <div className="flex space-x-2 p-4">
        {users.map((user: any) => (
            <img
            key={user.email}
            src={user.image}
            alt={user.name}
            className="w-10 h-10 rounded-full border-2 border-white"
            title={user.name}
            />
        ))}
        </div>
    );
}
            