import NavBar from "@/components/NavBar/NavBar";
import Avatars from "../components/FlowSpace/Avatars";
import BackgroundPicker from "../components/FlowSpace/BackgroundPicker";
import SpotifyPlayer from "../components/FlowSpace/SpotifyPlayer";

export default function FlowSpacePage() {
  return (
    <>
      <NavBar />
      <Avatars />
      <BackgroundPicker />
      <SpotifyPlayer />
    </>
    
  );

}