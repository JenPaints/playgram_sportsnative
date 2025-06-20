import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import LoadingSpinner from "../ui/LoadingSpinner";
import { Crown, Trophy, Star } from "lucide-react";
import { Avatar } from "../ui/Avatar";

export function Leaderboard() {
  const leaderboard = useQuery(api.users.getLeaderboard);

  if (leaderboard === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Top 3 for podium
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-extrabold text-white drop-shadow-lg flex items-center gap-2">
          <Trophy className="text-yellow-400 animate-bounce" size={32} /> Leaderboard
        </h2>
        <div className="text-sm text-indigo-200">Top performers</div>
      </div>

      {/* Podium for Top 3 */}
      <div className="flex flex-col md:flex-row items-end justify-center gap-8 mb-8">
        {top3.map((player, idx) => {
          // Podium height and color
          const heights = [44, 64, 36];
          const colors = ["from-yellow-400 to-yellow-600", "from-gray-400 to-gray-600", "from-orange-400 to-orange-600"];
          const icons = [<Crown className="text-yellow-300 animate-pulse" size={32} />, <Star className="text-gray-300" size={28} />, <Star className="text-orange-300" size={28} />];
          const order = idx === 1 ? 0 : idx === 0 ? 1 : 2; // 2nd, 1st, 3rd
          return (
            <motion.div
              key={player.userId}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, type: "spring" }}
              className={`flex flex-col items-center justify-end z-10 order-${order}`}
              style={{ minWidth: 120 }}
            >
              <div className={`mb-2`}>{icons[idx]}</div>
              <div className={`rounded-full ring-4 ring-white/30 shadow-xl mb-2`}>
                <Avatar
                  src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(player.firstName + ' ' + player.lastName)}`}
                  alt={player.firstName}
                  size={heights[idx]}
                />
              </div>
              <div className={`text-lg font-bold text-white`}>{player.firstName} {player.lastName}</div>
              <div className="text-indigo-200 text-xs mb-1">Level {player.level}</div>
              <div className={`bg-gradient-to-r ${colors[idx]} px-4 py-2 rounded-xl text-white font-extrabold text-xl shadow-lg mb-2`}>{player.totalPoints} pts</div>
              <div className="text-2xl font-black text-white drop-shadow-lg">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}</div>
            </motion.div>
          );
        })}
        </div>

      {/* Rest of leaderboard */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-indigo-400 overflow-hidden max-h-[420px] overflow-y-auto">
        <div className="divide-y divide-indigo-800">
          {rest.map((player, index) => (
            <motion.div
              key={player.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              className="p-4 hover:bg-indigo-900/40 transition-colors flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-indigo-700 text-white">
                  {index + 4}
                  </div>
                <Avatar
                  src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(player.firstName + ' ' + player.lastName)}`}
                  alt={player.firstName}
                  size={36}
                />
                  <div>
                    <div className="font-semibold text-white">{player.firstName} {player.lastName}</div>
                  <div className="text-xs text-indigo-200">Level {player.level}</div>
                </div>
              </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-400">{player.totalPoints}</div>
                <div className="text-xs text-indigo-200">points</div>
              </div>
            </motion.div>
          ))}
        </div>
        {rest.length === 0 && (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-lg font-semibold text-white mb-2">No Rankings Yet</h3>
            <p className="text-indigo-200">
              Start attending classes and earning points to appear on the leaderboard!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
