import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import { LoadingSpinner } from "../ui/LoadingSpinner";

export function Leaderboard() {
  const leaderboard = useQuery(api.users.getLeaderboard);

  if (leaderboard === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
        <div className="text-sm text-gray-400">Top performers</div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-yellow-500 to-orange-600">
          <h3 className="text-xl font-bold text-white mb-2">🏆 Top Players</h3>
          <p className="text-yellow-100">Compete with fellow athletes and climb the ranks!</p>
        </div>

        <div className="divide-y divide-gray-700">
          {leaderboard.map((player, index) => (
            <motion.div
              key={player.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? "bg-yellow-500 text-black" :
                    index === 1 ? "bg-gray-400 text-black" :
                    index === 2 ? "bg-orange-600 text-white" :
                    "bg-gray-600 text-white"
                  }`}>
                    {index < 3 ? (
                      index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"
                    ) : (
                      player.rank
                    )}
                  </div>
                  
                  <div>
                    <div className="font-semibold text-white">{player.firstName} {player.lastName}</div>
                    <div className="text-sm text-gray-400">Level {player.level}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-yellow-400">{player.totalPoints}</div>
                  <div className="text-xs text-gray-400">points</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {leaderboard.length === 0 && (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-lg font-semibold text-white mb-2">No Rankings Yet</h3>
            <p className="text-gray-400">
              Start attending classes and earning points to appear on the leaderboard!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
