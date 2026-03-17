"use client";

import { RoomPage } from "@/features/room/room-page";

type RoomClientPageProps = {
  roomId: string;
};

export default function RoomClientPage({ roomId }: RoomClientPageProps) {
  return <RoomPage roomId={roomId} />;
}
