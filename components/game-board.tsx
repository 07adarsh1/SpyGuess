import type { BoardTile } from "@/store/game-store";
import { motion } from "framer-motion";

type GameBoardProps = {
  tiles: BoardTile[];
  onTileClick: (tileId: number) => void;
  disabled?: boolean;
  revealAllColors?: boolean;
};

const revealedTileClasses: Record<BoardTile["type"], string> = {
  red: "bg-red-100 border-red-300 text-red-900",
  blue: "bg-blue-100 border-blue-300 text-blue-900",
  neutral: "bg-zinc-200 border-zinc-300 text-zinc-800",
  assassin: "bg-zinc-900 border-zinc-900 text-white",
};

export function GameBoard({
  tiles,
  onTileClick,
  disabled = false,
  revealAllColors = false,
}: GameBoardProps) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {tiles.map((tile, index) => (
        <motion.button
          type="button"
          key={tile.id}
          data-type={tile.type}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: index * 0.008 }}
          whileHover={tile.revealed || disabled ? undefined : { y: -2, scale: 1.01 }}
          whileTap={tile.revealed || disabled ? undefined : { scale: 0.98 }}
          onClick={() => onTileClick(tile.id)}
          disabled={disabled || tile.revealed}
          className={`flex aspect-[4/3] min-h-16 items-center justify-center rounded-xl border px-2 text-center text-xs font-medium uppercase tracking-wide shadow-sm transition-transform duration-200 sm:min-h-20 sm:px-3 sm:text-sm ${
            tile.revealed || revealAllColors
              ? `${revealedTileClasses[tile.type]} cursor-default`
              : "bg-background hover:shadow-md"
          } disabled:opacity-100`}
        >
          {tile.word}
        </motion.button>
      ))}
    </div>
  );
}
