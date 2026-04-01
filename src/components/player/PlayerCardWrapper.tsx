import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { externalSupabase } from "@/lib/supabase-external";
import PlayerCard from "@/components/player/PlayerCard";
import { Player, Team, PlayerCard as PlayerCardType } from "@/types/team";
import { Loader2 } from "lucide-react";

// Wrapper for standalone card route to fetch data
export const PlayerCardWrapper = () => {
   const { playerSlug } = useParams<{ playerSlug: string }>();
   const isNumericId = playerSlug && /^\d+$/.test(playerSlug);

   const { data: player, isLoading } = useQuery({
      queryKey: ['player-detail-card', playerSlug],
      queryFn: async () => {
         let query = externalSupabase.from('alih_players').select('*');
         if (isNumericId) query = query.eq('id', playerSlug);
         else query = query.eq('slug', playerSlug);
         const { data, error } = await query.single();
         if (error) throw error;
         return data as Player;
      },
      enabled: !!playerSlug
   });

   const { data: team } = useQuery({
      queryKey: ['team-for-player-card', player?.team_id],
      queryFn: async () => {
         const { data, error } = await externalSupabase
            .from('alih_teams').select('*').eq('id', player!.team_id).single();
         if (error) throw error;
         return data as Team;
      },
      enabled: !!player?.team_id
   });

   const { user } = useAuth();
   
   // Fetch user's card if logged in
   const { data: myCard } = useQuery({
      queryKey: ['my-player-card-wrapper', player?.id, user?.id],
      queryFn: async () => {
         if (!user || !player) return null;
         const { data, error } = await externalSupabase
            .from('player_cards')
            .select('*')
            .eq('user_id', user.id)
            .eq('player_id', player.id)
            .maybeSingle();
         
         if (error && error.code !== 'PGRST116') throw error;
         return data as PlayerCardType | null;
      },
      enabled: !!player && !!user
   });

   if (isLoading) return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950">
         <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
   );
   
   if (!player) return <div>Player not found</div>;

   return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 p-4">
         <div className="w-full max-w-[360px]">
            <PlayerCard 
               player={player} 
               team={team || null} 
               cardData={myCard || undefined}
               showRotateHint={true} 
               ownerName={user?.user_metadata?.nickname || ( user?.email ? user.email.split('@')[0] : undefined )}
               className="w-full aspect-[2/3] shadow-2xl"
            />
         </div>
      </div>
   );
};

export default PlayerCardWrapper;
