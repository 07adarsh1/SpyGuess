import RoomClientPage from "./room-client";

type RoomPageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;

  return <RoomClientPage roomId={roomId} />;
}
