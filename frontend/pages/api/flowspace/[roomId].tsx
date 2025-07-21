import {useEffect, useState} from "react";
import { use Router } from "next/router";
import { useSession } from "next-auth/react";
import { PrismaClient } from "@prisma/client";
import BackgroundPicker from "../../../components/FlowSpace/BackgroundPicker";
import SpotifyPlayer from "../../../components/FlowSpace/SpotifyPlayer";
import Avatars from "../../../components/FlowSpace/Avatars";

export default function FlowSpacePage() {
    const { data: session} = useSession();
    const router = useRouter();
    const roomId = router.query.roomId as string;
    const [room, setRoom] = useState<any>(null);
    const [avatars, setAvatars] = useState<any>(null);
    const [background, setBackground] = useState<any>(null);
    const [spotify, setSpotify] = useState<any>(null);

    const prisma = new PrismaClient();

    useEffect(() => {
        if (session) {
            const userId = session.user.id;
            prisma.room.findUnique({
                where: {
                    id: roomId,
                },
                include: {
                    members: true,
                    background: true,
                    spotify: true,
                },
            }).then((room) => {
                setRoom(room);
                setAvatars(room.members.map((member: any) => {
                    return <Avatars key={member.id} member={member} userId={userId}/>
                }));
                setBackground(room.background);
                setSpotify(room.spotify);
            });
        }
    }, [session, roomId]);

    return (
        <div>
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="flex flex-col items-center justify-center w-full h-full">
                    <div className="flex flex-col items-center justify-center w-full h-full">
                        {room && <BackgroundPicker room={room} setBackground={setBackground}/>}
                        {background && <img src={background.url} alt="background" className="w-full h-full object-cover"/>}
                        {room && <SpotifyPlayer room={room} setSpotify={setSpotify}/>}
                        {spotify && <iframe src={spotify.url} width="300" height="380" frameBorder="0" allowtransparency="true" allow="encrypted-media"></iframe>}
                        {avatars}
                    </div>
                </div>
            </div>
        </div>
    );
}               